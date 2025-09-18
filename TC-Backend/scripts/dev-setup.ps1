# TCWatch Development Environment Setup Script (PowerShell)
# This script sets up the complete development environment on Windows

param(
    [switch]$SkipDocker,
    [switch]$SkipDeps,
    [switch]$Quiet
)

# Colors for output
$Colors = @{
    Red = 'Red'
    Green = 'Green'
    Yellow = 'Yellow'
    Blue = 'Blue'
    Cyan = 'Cyan'
}

function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    if (-not $Quiet) {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerRunning {
    try {
        docker info 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Check-Prerequisites {
    Write-ColoredOutput "🔍 Checking prerequisites..." $Colors.Blue

    # Check Docker
    if (-not (Test-Command "docker")) {
        Write-ColoredOutput "❌ Docker is not installed. Please install Docker Desktop first." $Colors.Red
        exit 1
    }

    if (-not (Test-DockerRunning)) {
        Write-ColoredOutput "❌ Docker is not running. Please start Docker Desktop first." $Colors.Red
        exit 1
    }

    Write-ColoredOutput "✅ Docker is installed and running" $Colors.Green

    # Check Docker Compose
    $hasDockerCompose = (Test-Command "docker-compose") -or (docker compose version 2>$null)
    if (-not $hasDockerCompose) {
        Write-ColoredOutput "❌ Docker Compose is not available." $Colors.Red
        exit 1
    }

    Write-ColoredOutput "✅ Docker Compose is available" $Colors.Green

    # Check Node.js
    if (-not (Test-Command "node")) {
        Write-ColoredOutput "⚠️  Node.js is not installed. Some features may not work." $Colors.Yellow
    } else {
        $nodeVersion = node --version
        Write-ColoredOutput "✅ Node.js is installed ($nodeVersion)" $Colors.Green
    }

    # Check npm
    if (-not (Test-Command "npm")) {
        Write-ColoredOutput "⚠️  npm is not installed. Some features may not work." $Colors.Yellow
    } else {
        $npmVersion = npm --version
        Write-ColoredOutput "✅ npm is installed ($npmVersion)" $Colors.Green
    }
}

function Setup-Environment {
    Write-ColoredOutput "🔧 Setting up environment variables..." $Colors.Blue

    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-ColoredOutput "✅ Created .env file from .env.example" $Colors.Green
        Write-ColoredOutput "⚠️  Please update the .env file with your actual API keys and secrets" $Colors.Yellow
    } else {
        Write-ColoredOutput "⚠️  .env file already exists, skipping..." $Colors.Yellow
    }
}

function Install-Dependencies {
    if ($SkipDeps) {
        Write-ColoredOutput "⏭️  Skipping dependency installation" $Colors.Yellow
        return
    }

    Write-ColoredOutput "📦 Installing Node.js dependencies..." $Colors.Blue

    if (Test-Path "package.json") {
        try {
            npm install
            Write-ColoredOutput "✅ Dependencies installed" $Colors.Green
        }
        catch {
            Write-ColoredOutput "❌ Failed to install dependencies" $Colors.Red
            Write-ColoredOutput $_.Exception.Message $Colors.Red
        }
    } else {
        Write-ColoredOutput "⚠️  package.json not found, skipping npm install" $Colors.Yellow
    }
}

function Start-DockerServices {
    if ($SkipDocker) {
        Write-ColoredOutput "⏭️  Skipping Docker services" $Colors.Yellow
        return
    }

    Write-ColoredOutput "🐳 Starting Docker services..." $Colors.Blue

    try {
        # Pull latest images
        Write-ColoredOutput "📥 Pulling latest Docker images..." $Colors.Cyan
        docker-compose pull

        # Start services
        Write-ColoredOutput "🚀 Starting services..." $Colors.Cyan
        docker-compose up -d

        Write-ColoredOutput "✅ Docker services started" $Colors.Green
    }
    catch {
        Write-ColoredOutput "❌ Failed to start Docker services" $Colors.Red
        Write-ColoredOutput $_.Exception.Message $Colors.Red
        throw
    }
}

function Wait-ForServices {
    if ($SkipDocker) {
        return
    }

    Write-ColoredOutput "⏳ Waiting for services to be ready..." $Colors.Blue

    $services = @("postgres", "redis", "meilisearch", "temporal-server")
    $timeout = 60

    foreach ($service in $services) {
        Write-ColoredOutput "⏳ Waiting for $service..." $Colors.Yellow

        $elapsed = 0
        $ready = $false

        while ($elapsed -lt $timeout -and -not $ready) {
            try {
                $status = docker-compose ps --format json | ConvertFrom-Json | Where-Object { $_.Service -eq $service }
                if ($status -and ($status.State -eq "running" -or $status.Health -eq "healthy")) {
                    Write-ColoredOutput "✅ $service is ready" $Colors.Green
                    $ready = $true
                    break
                }
            }
            catch {
                # Continue waiting
            }

            Start-Sleep -Seconds 2
            $elapsed += 2
        }

        if (-not $ready) {
            Write-ColoredOutput "⚠️  Timeout waiting for $service" $Colors.Yellow
            Write-ColoredOutput "You can check service logs with: docker-compose logs $service" $Colors.Cyan
        }
    }
}

function Show-Status {
    Write-ColoredOutput "`n🔍 Service Status:" $Colors.Blue
    Write-ColoredOutput "================" $Colors.Blue

    if (-not $SkipDocker) {
        try {
            docker-compose ps
        }
        catch {
            Write-ColoredOutput "❌ Unable to get service status" $Colors.Red
        }
    }

    Write-ColoredOutput "`n🌐 Available Services:" $Colors.Blue
    Write-ColoredOutput "======================" $Colors.Blue
    Write-ColoredOutput "🗄️  PostgreSQL: localhost:5432" $Colors.Cyan
    Write-ColoredOutput "🔴 Redis: localhost:6379" $Colors.Cyan
    Write-ColoredOutput "🔍 Meilisearch: http://localhost:7700" $Colors.Cyan
    Write-ColoredOutput "⚡ Temporal UI: http://localhost:8088" $Colors.Cyan
    Write-ColoredOutput "🔧 Redis Commander: http://localhost:8081 (run 'npm run docker:tools' to enable)" $Colors.Cyan
    Write-ColoredOutput "💾 Adminer: http://localhost:8082 (run 'npm run docker:tools' to enable)" $Colors.Cyan
    Write-ColoredOutput "🌐 API Gateway: http://localhost:80" $Colors.Cyan
    Write-ColoredOutput "🔧 Backend API: http://localhost:3000" $Colors.Cyan

    Write-ColoredOutput "`n📋 Next Steps:" $Colors.Blue
    Write-ColoredOutput "===============" $Colors.Blue
    Write-ColoredOutput "1. Update your .env file with real API keys" $Colors.White
    Write-ColoredOutput "2. Run 'npm run dev' to start the backend server" $Colors.White
    Write-ColoredOutput "3. Visit http://localhost:3000/health to verify the API is running" $Colors.White
    Write-ColoredOutput "4. Run 'npm run docker:tools' to enable development tools" $Colors.White
}

function Main {
    try {
        Write-ColoredOutput "🚀 TCWatch Development Environment Setup" $Colors.Green
        Write-ColoredOutput "=========================================" $Colors.Green

        # Check prerequisites
        Check-Prerequisites

        # Setup environment
        Setup-Environment

        # Install dependencies
        Install-Dependencies

        # Start Docker services
        Start-DockerServices

        # Wait for services
        Wait-ForServices

        # Show status
        Show-Status

        Write-ColoredOutput "`n🎉 Development environment setup complete!" $Colors.Green
    }
    catch {
        Write-ColoredOutput "`n❌ Setup failed:" $Colors.Red
        Write-ColoredOutput $_.Exception.Message $Colors.Red
        exit 1
    }
}

# Handle Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action {
    if (-not $SkipDocker) {
        Write-ColoredOutput "`n🧹 Cleaning up..." $Colors.Yellow
        try {
            docker-compose down
        }
        catch {
            # Ignore cleanup errors
        }
    }
}

# Run main function
Main