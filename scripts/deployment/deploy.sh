#!/bin/bash

# TCWatch Deployment Script
# Supports multiple deployment targets and environments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Help function
show_help() {
    cat << EOF
TCWatch Deployment Script

Usage: $0 [OPTIONS] <environment> <target>

ENVIRONMENTS:
    staging     Deploy to staging environment
    production  Deploy to production environment

TARGETS:
    vercel      Deploy web application to Vercel
    docker      Deploy using Docker containers
    eas         Deploy mobile app using Expo EAS

OPTIONS:
    -h, --help          Show this help message
    -v, --verbose       Enable verbose output
    -d, --dry-run       Show what would be deployed without executing
    --skip-tests        Skip running tests before deployment
    --skip-build        Skip build step (use existing build)

EXAMPLES:
    $0 staging vercel           Deploy web app to staging on Vercel
    $0 production docker        Deploy to production using Docker
    $0 staging eas              Build and deploy mobile app to staging
    $0 production vercel -v     Deploy to production with verbose output

ENVIRONMENT VARIABLES:
    VERCEL_TOKEN               Vercel deployment token
    DOCKER_REGISTRY           Docker registry URL
    EAS_BUILD_PROFILE         EAS build profile (staging/production)
EOF
}

# Validate inputs
validate_inputs() {
    case "$ENVIRONMENT" in
        staging|production) ;;
        *) print_error "Invalid environment: $ENVIRONMENT"; show_help; exit 1 ;;
    esac

    case "$TARGET" in
        vercel|docker|eas) ;;
        *) print_error "Invalid target: $TARGET"; show_help; exit 1 ;;
    esac
}

# Pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."

    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "Not in a TCWatch project directory"
        exit 1
    fi

    # Check git status
    if [ -n "$(git status --porcelain)" ] && [ "$DRY_RUN" != "true" ]; then
        print_warning "Working directory is not clean. Uncommitted changes may not be deployed."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi

    # Check environment file
    case "$ENVIRONMENT" in
        staging)
            if [ ! -f ".env.staging" ]; then
                print_error ".env.staging file not found"
                exit 1
            fi
            ;;
        production)
            if [ ! -f ".env.production" ]; then
                print_error ".env.production file not found"
                exit 1
            fi
            ;;
    esac

    print_success "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        print_warning "Skipping tests"
        return
    fi

    print_status "Running tests..."

    # Run linting
    npm run lint

    # Run type checking
    npm run type-check

    # Run unit tests
    npm run test

    print_success "All tests passed"
}

# Build application
build_application() {
    if [ "$SKIP_BUILD" = "true" ]; then
        print_warning "Skipping build"
        return
    fi

    print_status "Building application for $ENVIRONMENT..."

    case "$TARGET" in
        vercel)
            print_status "Building web application..."
            cd TC-Frontend
            npm run build
            cd ..
            ;;
        docker)
            print_status "Building Docker images..."
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
            ;;
        eas)
            print_status "EAS build will be handled during deployment"
            ;;
    esac

    print_success "Build completed"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel ($ENVIRONMENT)..."

    if [ -z "$VERCEL_TOKEN" ]; then
        print_error "VERCEL_TOKEN environment variable not set"
        exit 1
    fi

    cd TC-Frontend

    if [ "$DRY_RUN" = "true" ]; then
        print_status "DRY RUN: Would deploy to Vercel with environment: $ENVIRONMENT"
        return
    fi

    case "$ENVIRONMENT" in
        staging)
            npx vercel --prod=false --env-file=../.env.staging
            ;;
        production)
            npx vercel --prod --env-file=../.env.production
            ;;
    esac

    cd ..
    print_success "Vercel deployment completed"
}

# Deploy using Docker
deploy_docker() {
    print_status "Deploying using Docker ($ENVIRONMENT)..."

    if [ "$DRY_RUN" = "true" ]; then
        print_status "DRY RUN: Would deploy Docker containers for environment: $ENVIRONMENT"
        return
    fi

    # Tag images with environment
    docker tag tcwatch-backend:latest "${DOCKER_REGISTRY:-localhost:5000}/tcwatch-backend:$ENVIRONMENT"

    # Push to registry if configured
    if [ -n "$DOCKER_REGISTRY" ]; then
        print_status "Pushing to Docker registry..."
        docker push "${DOCKER_REGISTRY}/tcwatch-backend:$ENVIRONMENT"
    fi

    # Deploy based on environment
    case "$ENVIRONMENT" in
        staging)
            docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
            ;;
        production)
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
            ;;
    esac

    print_success "Docker deployment completed"
}

# Deploy mobile app using EAS
deploy_eas() {
    print_status "Deploying mobile app using EAS ($ENVIRONMENT)..."

    cd TC-Frontend

    if [ "$DRY_RUN" = "true" ]; then
        print_status "DRY RUN: Would build and submit mobile app for environment: $ENVIRONMENT"
        return
    fi

    # Build for the specified environment
    case "$ENVIRONMENT" in
        staging)
            npx eas build --platform all --profile staging
            ;;
        production)
            npx eas build --platform all --profile production
            npx eas submit --platform all
            ;;
    esac

    cd ..
    print_success "EAS deployment completed"
}

# Post-deployment tasks
post_deployment() {
    print_status "Running post-deployment tasks..."

    case "$TARGET" in
        vercel|docker)
            print_status "Running health checks..."
            sleep 10  # Wait for services to start

            # Health check URL based on environment
            case "$ENVIRONMENT" in
                staging)
                    HEALTH_URL="https://api-staging.tcwatch.app/health"
                    ;;
                production)
                    HEALTH_URL="https://api.tcwatch.app/health"
                    ;;
            esac

            if [ "$TARGET" = "docker" ]; then
                HEALTH_URL="http://localhost/health"
            fi

            # Perform health check
            if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
                print_success "Health check passed"
            else
                print_warning "Health check failed - service may still be starting"
            fi
            ;;
    esac

    print_success "Post-deployment tasks completed"
}

# Create deployment summary
create_deployment_summary() {
    print_success "Deployment Summary"
    echo "=================="
    echo "Environment: $ENVIRONMENT"
    echo "Target: $TARGET"
    echo "Timestamp: $(date)"
    echo "Git Commit: $(git rev-parse HEAD)"
    echo "Git Branch: $(git rev-parse --abbrev-ref HEAD)"

    case "$TARGET" in
        vercel)
            echo "Vercel URL: Check Vercel dashboard for deployment URL"
            ;;
        docker)
            echo "Docker Services: $(docker-compose ps --services | tr '\n' ' ')"
            ;;
        eas)
            echo "EAS Build: Check Expo dashboard for build status"
            ;;
    esac

    echo ""
    print_success "Deployment completed successfully!"
}

# Main execution
main() {
    # Parse command line arguments
    ENVIRONMENT=""
    TARGET=""
    VERBOSE=false
    DRY_RUN=false
    SKIP_TESTS=false
    SKIP_BUILD=false

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
            -d|--dry-run)
                DRY_RUN=true
                print_warning "DRY RUN MODE - No actual deployment will occur"
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            staging|production)
                ENVIRONMENT=$1
                shift
                ;;
            vercel|docker|eas)
                TARGET=$1
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [ -z "$ENVIRONMENT" ] || [ -z "$TARGET" ]; then
        print_error "Both environment and target must be specified"
        show_help
        exit 1
    fi

    validate_inputs
    pre_deployment_checks

    if [ "$DRY_RUN" != "true" ]; then
        run_tests
        build_application
    fi

    # Execute deployment
    case "$TARGET" in
        vercel)
            deploy_vercel
            ;;
        docker)
            deploy_docker
            ;;
        eas)
            deploy_eas
            ;;
    esac

    if [ "$DRY_RUN" != "true" ]; then
        post_deployment
        create_deployment_summary
    else
        print_success "DRY RUN completed - no actual deployment performed"
    fi
}

# Execute main function with all arguments
main "$@"