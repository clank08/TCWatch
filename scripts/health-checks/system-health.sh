#!/bin/bash

# TCWatch System Health Check Script
# Comprehensive health checking for all services

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Global health status
OVERALL_HEALTH=true

# Health check functions
check_service_health() {
    local service_name=$1
    local health_url=$2
    local timeout=${3:-10}

    print_status "Checking $service_name..."

    if curl -f -s --max-time "$timeout" "$health_url" > /dev/null 2>&1; then
        print_success "$service_name is healthy"
        return 0
    else
        print_error "$service_name is unhealthy"
        OVERALL_HEALTH=false
        return 1
    fi
}

check_docker_service() {
    local service_name=$1
    local container_name=$2

    print_status "Checking Docker service: $service_name..."

    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        # Check if container is healthy (if health check is configured)
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

        case "$health_status" in
            "healthy")
                print_success "$service_name container is running and healthy"
                return 0
                ;;
            "unhealthy")
                print_error "$service_name container is running but unhealthy"
                OVERALL_HEALTH=false
                return 1
                ;;
            "starting")
                print_warning "$service_name container is starting..."
                return 0
                ;;
            "none")
                print_success "$service_name container is running (no health check configured)"
                return 0
                ;;
            *)
                print_warning "$service_name container status: $health_status"
                return 0
                ;;
        esac
    else
        print_error "$service_name container is not running"
        OVERALL_HEALTH=false
        return 1
    fi
}

check_database_connection() {
    print_status "Checking database connection..."

    # Check if we can connect to the database
    if [ -n "$DATABASE_URL" ]; then
        # Try to connect using psql if available
        if command -v psql &> /dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
                print_success "Database connection successful"
                return 0
            else
                print_error "Cannot connect to database"
                OVERALL_HEALTH=false
                return 1
            fi
        else
            print_warning "psql not available - skipping direct database connection test"
            return 0
        fi
    else
        print_warning "DATABASE_URL not set - skipping database connection test"
        return 0
    fi
}

check_redis_connection() {
    print_status "Checking Redis connection..."

    # Check Redis through backend API or direct connection
    if check_service_health "Redis" "http://localhost:6379" 2; then
        return 0
    else
        # Try through Redis CLI if available
        if command -v redis-cli &> /dev/null; then
            if redis-cli ping > /dev/null 2>&1; then
                print_success "Redis is responding to ping"
                return 0
            else
                print_error "Redis is not responding"
                OVERALL_HEALTH=false
                return 1
            fi
        else
            print_warning "Cannot check Redis directly - redis-cli not available"
            return 0
        fi
    fi
}

check_external_apis() {
    print_status "Checking external API connectivity..."

    local apis=(
        "TMDb:https://api.themoviedb.org/3/configuration"
        "Watchmode:https://api.watchmode.com/v1/regions/"
        "TVMaze:https://api.tvmaze.com/shows/1"
    )

    local failed_apis=0

    for api in "${apis[@]}"; do
        local name="${api%%:*}"
        local url="${api##*:}"

        if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
            print_success "$name API is reachable"
        else
            print_warning "$name API is unreachable (this may be normal if API keys are not configured)"
            ((failed_apis++))
        fi
    done

    if [ $failed_apis -eq ${#apis[@]} ]; then
        print_warning "All external APIs appear unreachable - check network connectivity"
    fi
}

check_disk_space() {
    print_status "Checking disk space..."

    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ "$usage" -lt 80 ]; then
        print_success "Disk space usage: ${usage}% (healthy)"
    elif [ "$usage" -lt 90 ]; then
        print_warning "Disk space usage: ${usage}% (warning)"
    else
        print_error "Disk space usage: ${usage}% (critical)"
        OVERALL_HEALTH=false
    fi
}

check_memory_usage() {
    print_status "Checking memory usage..."

    if command -v free &> /dev/null; then
        local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

        if [ "$mem_usage" -lt 80 ]; then
            print_success "Memory usage: ${mem_usage}% (healthy)"
        elif [ "$mem_usage" -lt 90 ]; then
            print_warning "Memory usage: ${mem_usage}% (warning)"
        else
            print_error "Memory usage: ${mem_usage}% (critical)"
            OVERALL_HEALTH=false
        fi
    else
        print_warning "Cannot check memory usage - 'free' command not available"
    fi
}

check_load_average() {
    print_status "Checking system load..."

    if command -v uptime &> /dev/null; then
        local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        local cpu_cores=$(nproc 2>/dev/null || echo "1")
        local load_percent=$(echo "$load $cpu_cores" | awk '{printf "%.0f", ($1/$2)*100}')

        if [ "$load_percent" -lt 70 ]; then
            print_success "System load: ${load_percent}% (healthy)"
        elif [ "$load_percent" -lt 90 ]; then
            print_warning "System load: ${load_percent}% (warning)"
        else
            print_error "System load: ${load_percent}% (critical)"
            OVERALL_HEALTH=false
        fi
    else
        print_warning "Cannot check system load - 'uptime' command not available"
    fi
}

check_ssl_certificates() {
    print_status "Checking SSL certificates..."

    local domains=(
        "api.tcwatch.app"
        "staging.tcwatch.app"
    )

    for domain in "${domains[@]}"; do
        if command -v openssl &> /dev/null; then
            local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

            if [ $? -eq 0 ]; then
                local expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
                local expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

                if [ "$days_until_expiry" -gt 30 ]; then
                    print_success "$domain SSL certificate expires in $days_until_expiry days"
                elif [ "$days_until_expiry" -gt 7 ]; then
                    print_warning "$domain SSL certificate expires in $days_until_expiry days"
                else
                    print_error "$domain SSL certificate expires in $days_until_expiry days"
                    OVERALL_HEALTH=false
                fi
            else
                print_warning "Cannot check SSL certificate for $domain"
            fi
        else
            print_warning "Cannot check SSL certificates - openssl not available"
            break
        fi
    done
}

# Main health check execution
main() {
    echo "TCWatch System Health Check"
    echo "============================"
    echo "Timestamp: $(date)"
    echo ""

    # Load environment variables if available
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        set -a
        source "$PROJECT_ROOT/.env.local"
        set +a
    fi

    # Core service health checks
    echo "🔍 Core Services"
    echo "----------------"

    # Check main application
    check_service_health "Backend API" "http://localhost:3000/health" 10

    # Check Docker services
    check_docker_service "Backend" "tcwatch-backend"
    check_docker_service "Redis" "tcwatch-redis"
    check_docker_service "Meilisearch" "tcwatch-meilisearch"
    check_docker_service "Nginx" "tcwatch-nginx"

    echo ""
    echo "🗄️  Data Services"
    echo "----------------"

    check_database_connection
    check_redis_connection
    check_service_health "Meilisearch" "http://localhost:7700/health" 5

    echo ""
    echo "🌐 External Services"
    echo "-------------------"

    check_external_apis

    echo ""
    echo "💻 System Resources"
    echo "------------------"

    check_disk_space
    check_memory_usage
    check_load_average

    echo ""
    echo "🔒 Security"
    echo "----------"

    check_ssl_certificates

    echo ""
    echo "📊 Health Summary"
    echo "=================="

    if [ "$OVERALL_HEALTH" = true ]; then
        print_success "Overall system health: HEALTHY"
        echo ""
        echo "✅ All critical services are operational"
        echo "🎯 System is ready for normal operation"
        exit 0
    else
        print_error "Overall system health: UNHEALTHY"
        echo ""
        echo "❌ One or more critical issues detected"
        echo "🚨 Immediate attention required"
        exit 1
    fi
}

# Help function
show_help() {
    cat << EOF
TCWatch System Health Check

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help     Show this help message
    -v, --verbose  Enable verbose output
    -q, --quiet    Suppress non-critical output

This script performs comprehensive health checks on:
- Core application services
- Database and cache connections
- External API connectivity
- System resources (disk, memory, CPU)
- SSL certificate status

Exit codes:
    0  All checks passed (healthy)
    1  One or more checks failed (unhealthy)
EOF
}

# Parse command line arguments
VERBOSE=false
QUIET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute main function
main