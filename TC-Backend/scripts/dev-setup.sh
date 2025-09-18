#!/bin/bash

# TCWatch Development Environment Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 TCWatch Development Environment Setup"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed and running
check_docker() {
    echo -e "${BLUE}Checking Docker installation...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi

    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Docker is installed and running${NC}"
}

# Check if Docker Compose is available
check_docker_compose() {
    echo -e "${BLUE}Checking Docker Compose...${NC}"
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not available.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker Compose is available${NC}"
}

# Create environment file from example
setup_env() {
    echo -e "${BLUE}Setting up environment variables...${NC}"
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please update the .env file with your actual API keys and secrets${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
    fi
}

# Install Node.js dependencies
install_dependencies() {
    echo -e "${BLUE}Installing Node.js dependencies...${NC}"
    if [ -f package.json ]; then
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  package.json not found, skipping npm install${NC}"
    fi
}

# Start Docker services
start_services() {
    echo -e "${BLUE}Starting Docker services...${NC}"

    # Pull latest images
    docker-compose pull

    # Start services
    docker-compose up -d

    echo -e "${GREEN}✓ Docker services started${NC}"
}

# Wait for services to be healthy
wait_for_services() {
    echo -e "${BLUE}Waiting for services to be ready...${NC}"

    services=("postgres" "redis" "meilisearch" "temporal-server")

    for service in "${services[@]}"; do
        echo -e "${YELLOW}Waiting for $service...${NC}"

        timeout=60
        while [ $timeout -gt 0 ]; do
            if docker-compose ps | grep -q "$service.*healthy\|$service.*running"; then
                echo -e "${GREEN}✓ $service is ready${NC}"
                break
            fi

            sleep 2
            ((timeout-=2))
        done

        if [ $timeout -le 0 ]; then
            echo -e "${RED}✗ Timeout waiting for $service${NC}"
            echo -e "${YELLOW}You can check service logs with: docker-compose logs $service${NC}"
        fi
    done
}

# Show service status
show_status() {
    echo -e "\n${BLUE}Service Status:${NC}"
    echo "================"
    docker-compose ps

    echo -e "\n${BLUE}Available Services:${NC}"
    echo "==================="
    echo "🗄️  PostgreSQL: localhost:5432"
    echo "🔴 Redis: localhost:6379"
    echo "🔍 Meilisearch: http://localhost:7700"
    echo "⚡ Temporal UI: http://localhost:8088"
    echo "🔧 Redis Commander: http://localhost:8081 (run 'npm run docker:tools' to enable)"
    echo "💾 Adminer: http://localhost:8082 (run 'npm run docker:tools' to enable)"
    echo "🌐 API Gateway: http://localhost:80"
    echo "🔧 Backend API: http://localhost:3000"

    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "==========="
    echo "1. Update your .env file with real API keys"
    echo "2. Run 'npm run dev' to start the backend server"
    echo "3. Visit http://localhost:3000/health to verify the API is running"
    echo "4. Run 'npm run docker:tools' to enable development tools (Redis Commander, Adminer)"
}

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}Cleaning up...${NC}"
    docker-compose down
}

# Main execution
main() {
    # Check prerequisites
    check_docker
    check_docker_compose

    # Setup environment
    setup_env
    install_dependencies

    # Start services
    start_services
    wait_for_services

    # Show status
    show_status

    echo -e "\n${GREEN}🎉 Development environment setup complete!${NC}"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"