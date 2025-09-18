#!/bin/bash

# TCWatch Monitoring Stack Management Script
# Start/stop/restart the monitoring infrastructure

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

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Help function
show_help() {
    cat << EOF
TCWatch Monitoring Stack Management

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
    start       Start monitoring services
    stop        Stop monitoring services
    restart     Restart monitoring services
    status      Show status of monitoring services
    logs        Show logs from monitoring services
    setup       Initial setup and configuration

OPTIONS:
    -h, --help          Show this help message
    -v, --verbose       Enable verbose output
    --with-app          Include main application services
    --profile PROFILE   Use specific docker-compose profile

EXAMPLES:
    $0 start                Start monitoring stack
    $0 start --with-app     Start monitoring + main application
    $0 logs prometheus      Show Prometheus logs
    $0 restart grafana      Restart only Grafana
EOF
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        exit 1
    fi

    # Check monitoring configuration
    if [ ! -f "$PROJECT_ROOT/docker-compose.monitoring.yml" ]; then
        print_error "Monitoring configuration not found: docker-compose.monitoring.yml"
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Setup monitoring configuration
setup_monitoring() {
    print_status "Setting up monitoring configuration..."

    # Create monitoring data directories
    local dirs=(
        "monitoring/data/prometheus"
        "monitoring/data/grafana"
        "monitoring/data/loki"
        "monitoring/data/alertmanager"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
        print_status "Created directory: $dir"
    done

    # Set permissions for Grafana
    if [ -d "$PROJECT_ROOT/monitoring/data/grafana" ]; then
        chmod 777 "$PROJECT_ROOT/monitoring/data/grafana"
    fi

    # Create default Grafana dashboard
    create_default_dashboard

    print_success "Monitoring setup completed"
}

# Create default Grafana dashboard
create_default_dashboard() {
    local dashboard_file="$PROJECT_ROOT/monitoring/grafana/dashboards/tcwatch-overview.json"

    cat > "$dashboard_file" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "TCWatch Overview",
    "tags": ["tcwatch"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "API Response Time",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum{job=\"tcwatch-backend\"}[5m]) / rate(http_request_duration_seconds_count{job=\"tcwatch-backend\"}[5m])",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 0.5},
                {"color": "red", "value": 1}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"tcwatch-backend\"}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "bytes",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 536870912},
                {"color": "red", "value": 1073741824}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ]
  }
}
EOF

    print_status "Created default Grafana dashboard"
}

# Start monitoring services
start_monitoring() {
    local with_app=${1:-false}
    local profile=${2:-""}

    print_status "Starting monitoring services..."

    cd "$PROJECT_ROOT"

    # Start main application if requested
    if [ "$with_app" = "true" ]; then
        print_status "Starting main application services..."
        docker-compose up -d
    fi

    # Start monitoring stack
    local compose_cmd="docker-compose -f docker-compose.monitoring.yml"

    if [ -n "$profile" ]; then
        compose_cmd="$compose_cmd --profile $profile"
    fi

    $compose_cmd up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10

    check_services_health

    print_success "Monitoring services started"
    show_service_urls
}

# Stop monitoring services
stop_monitoring() {
    print_status "Stopping monitoring services..."

    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.monitoring.yml down

    print_success "Monitoring services stopped"
}

# Restart monitoring services
restart_monitoring() {
    local service=${1:-""}

    if [ -n "$service" ]; then
        print_status "Restarting monitoring service: $service"
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.monitoring.yml restart "$service"
    else
        print_status "Restarting all monitoring services..."
        stop_monitoring
        sleep 2
        start_monitoring
    fi

    print_success "Monitoring services restarted"
}

# Show monitoring services status
show_status() {
    print_status "Monitoring services status:"
    echo ""

    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.monitoring.yml ps

    echo ""
    print_status "Service health checks:"

    local services=(
        "Prometheus:http://localhost:9090/-/healthy"
        "Grafana:http://localhost:3001/api/health"
        "AlertManager:http://localhost:9093/-/healthy"
        "Loki:http://localhost:3100/ready"
    )

    for service in "${services[@]}"; do
        local name="${service%%:*}"
        local url="${service##*:}"

        if curl -f -s --max-time 5 "$url" > /dev/null 2>&1; then
            print_success "$name is healthy"
        else
            print_error "$name is unhealthy or not responding"
        fi
    done
}

# Show logs from monitoring services
show_logs() {
    local service=${1:-""}
    local follow=${2:-false}

    cd "$PROJECT_ROOT"

    if [ -n "$service" ]; then
        if [ "$follow" = "true" ]; then
            docker-compose -f docker-compose.monitoring.yml logs -f "$service"
        else
            docker-compose -f docker-compose.monitoring.yml logs --tail=50 "$service"
        fi
    else
        if [ "$follow" = "true" ]; then
            docker-compose -f docker-compose.monitoring.yml logs -f
        else
            docker-compose -f docker-compose.monitoring.yml logs --tail=50
        fi
    fi
}

# Check services health
check_services_health() {
    local max_attempts=12
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local healthy_services=0
        local total_services=4

        # Check each service
        if curl -f -s --max-time 3 "http://localhost:9090/-/healthy" > /dev/null 2>&1; then
            ((healthy_services++))
        fi

        if curl -f -s --max-time 3 "http://localhost:3001/api/health" > /dev/null 2>&1; then
            ((healthy_services++))
        fi

        if curl -f -s --max-time 3 "http://localhost:9093/-/healthy" > /dev/null 2>&1; then
            ((healthy_services++))
        fi

        if curl -f -s --max-time 3 "http://localhost:3100/ready" > /dev/null 2>&1; then
            ((healthy_services++))
        fi

        if [ $healthy_services -eq $total_services ]; then
            print_success "All monitoring services are healthy"
            return 0
        fi

        attempt=$((attempt + 1))
        print_status "Waiting for services to be ready... ($healthy_services/$total_services healthy)"
        sleep 5
    done

    print_warning "Some services may not be fully ready yet"
}

# Show service URLs
show_service_urls() {
    echo ""
    print_success "Monitoring services are available at:"
    echo ""
    echo "📊 Grafana:          http://localhost:3001"
    echo "   Username:         admin"
    echo "   Password:         admin123"
    echo ""
    echo "🔍 Prometheus:       http://localhost:9090"
    echo "🚨 AlertManager:     http://localhost:9093"
    echo "📝 Loki:             http://localhost:3100"
    echo "📈 Node Exporter:    http://localhost:9100"
    echo "🐳 cAdvisor:         http://localhost:8080"
    echo ""
    echo "💡 Quick Actions:"
    echo "   View all logs:    $0 logs"
    echo "   Check status:     $0 status"
    echo "   Stop services:    $0 stop"
    echo ""
}

# Main execution
main() {
    local command=""
    local with_app=false
    local profile=""
    local verbose=false
    local service=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|status|logs|setup)
                command=$1
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                set -x
                shift
                ;;
            --with-app)
                with_app=true
                shift
                ;;
            --profile)
                profile=$2
                shift 2
                ;;
            -*)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                service=$1
                shift
                ;;
        esac
    done

    # Default command
    if [ -z "$command" ]; then
        command="start"
    fi

    # Execute command
    case "$command" in
        start)
            check_prerequisites
            start_monitoring "$with_app" "$profile"
            ;;
        stop)
            stop_monitoring
            ;;
        restart)
            restart_monitoring "$service"
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$service" true
            ;;
        setup)
            check_prerequisites
            setup_monitoring
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"