#!/bin/bash

# TCWatch Development Environment Setup Script
# This script sets up the local development environment

set -e

echo "🚀 Setting up TCWatch development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop and try again."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi

    print_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. You'll need it for local development outside Docker."
        print_warning "Please install Node.js 20 LTS from https://nodejs.org/"
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    fi
}

# Create environment file if it doesn't exist
setup_env_file() {
    print_status "Setting up environment configuration..."

    if [ ! -f .env.local ]; then
        if [ -f .env.example ]; then
            cp .env.example .env.local
            print_success "Created .env.local from .env.example"
            print_warning "Please edit .env.local with your actual API keys and configuration"
        else
            print_error ".env.example not found. Please check your project structure."
            exit 1
        fi
    else
        print_success ".env.local already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."

    directories=(
        "logs/dev"
        "uploads/dev"
        "TC-Backend/docker/nginx/conf.d"
        "TC-Backend/docker/nginx/ssl"
    )

    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    done
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    if command -v npm &> /dev/null; then
        print_status "Installing root dependencies..."
        npm install

        print_status "Installing frontend dependencies..."
        cd TC-Frontend && npm install && cd ..

        print_status "Installing backend dependencies..."
        cd TC-Backend && npm install && cd ..

        print_success "All dependencies installed"
    else
        print_warning "npm not available. Dependencies will be installed in Docker containers."
    fi
}

# Create basic nginx configuration
create_nginx_config() {
    print_status "Creating basic nginx configuration..."

    cat > TC-Backend/docker/nginx/conf.d/default.conf << EOF
upstream backend {
    server tcwatch-backend:3000;
}

server {
    listen 80;
    server_name localhost;

    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://backend/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Default route
    location / {
        return 200 'TCWatch API Gateway';
        add_header Content-Type text/plain;
    }
}
EOF

    print_success "Created nginx configuration"
}

# Pull required Docker images
pull_docker_images() {
    print_status "Pulling required Docker images..."

    images=(
        "redis:7-alpine"
        "getmeili/meilisearch:v1.4"
        "nginx:alpine"
        "postgres:15-alpine"
    )

    for image in "${images[@]}"; do
        print_status "Pulling $image..."
        docker pull "$image"
    done

    print_success "Docker images pulled"
}

# Build and start services
start_services() {
    print_status "Building and starting services..."

    # Stop any existing services
    docker-compose down 2>/dev/null || true

    # Build and start services
    docker-compose up --build -d

    print_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."

    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            print_success "Services are healthy"
            return 0
        fi

        attempt=$((attempt + 1))
        print_status "Waiting... ($attempt/$max_attempts)"
        sleep 2
    done

    print_warning "Services may not be fully healthy yet. Check with: docker-compose ps"
}

# Show service URLs
show_service_urls() {
    print_success "Development environment is ready!"
    echo ""
    echo "🌐 Service URLs:"
    echo "   API Gateway:        http://localhost"
    echo "   Backend API:        http://localhost:3000"
    echo "   Redis Commander:    http://localhost:8081 (admin/admin123)"
    echo "   Meilisearch:        http://localhost:7700"
    echo "   Grafana:            http://localhost:3001 (run monitoring stack)"
    echo "   Prometheus:         http://localhost:9090 (run monitoring stack)"
    echo ""
    echo "📱 Mobile Development:"
    echo "   Frontend:           cd TC-Frontend && npm start"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs:          docker-compose logs -f"
    echo "   Stop services:      docker-compose down"
    echo "   Restart services:   docker-compose restart"
    echo "   Run monitoring:     docker-compose -f docker-compose.monitoring.yml up -d"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Edit .env.local with your API keys"
    echo "   2. Check service health: docker-compose ps"
    echo "   3. View application logs: docker-compose logs -f backend"
    echo "   4. Start frontend development: cd TC-Frontend && npm start"
}

# Main execution
main() {
    echo "TCWatch Development Setup"
    echo "========================="
    echo ""

    check_docker
    check_docker_compose
    check_node
    setup_env_file
    create_directories
    create_nginx_config

    if [ "$1" = "--full" ]; then
        install_dependencies
        pull_docker_images
        start_services
        wait_for_services
    else
        print_status "Run with --full flag to install dependencies and start services"
    fi

    show_service_urls
}

# Run main function with all arguments
main "$@"