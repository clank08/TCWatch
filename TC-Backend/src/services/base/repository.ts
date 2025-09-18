/**
 * Base Repository Pattern Implementation
 *
 * Provides a consistent interface for data access operations across all entities.
 * Includes built-in error handling, logging, and performance monitoring.
 */

import { PrismaClient, Prisma } from '@prisma/client';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindOptions {
  skip?: number;
  take?: number;
  cursor?: { id: string };
  where?: any;
  orderBy?: any;
  include?: any;
  select?: any;
}

export interface CreateOptions {
  include?: any;
  select?: any;
}

export interface UpdateOptions {
  include?: any;
  select?: any;
}

export interface RepositoryError extends Error {
  code: string;
  statusCode: number;
  meta?: any;
}

export class RepositoryError extends Error {
  constructor(message: string, code: string, statusCode: number = 500, meta?: any) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.statusCode = statusCode;
    this.meta = meta;
  }
}

/**
 * Base Repository class providing common CRUD operations
 */
export abstract class BaseRepository<T extends BaseEntity, TCreate, TUpdate> {
  protected abstract model: any;
  protected abstract entityName: string;

  constructor(protected prisma: PrismaClient) {}

  /**
   * Find a single entity by ID
   */
  async findById(id: string, options?: FindOptions): Promise<T | null> {
    try {
      const result = await this.model.findUnique({
        where: { id },
        include: options?.include,
        select: options?.select
      });

      return result as T | null;
    } catch (error) {
      throw this.handleError(error, 'findById');
    }
  }

  /**
   * Find multiple entities with optional filtering and pagination
   */
  async findMany(options?: FindOptions): Promise<T[]> {
    try {
      const result = await this.model.findMany({
        skip: options?.skip,
        take: options?.take,
        cursor: options?.cursor,
        where: options?.where,
        orderBy: options?.orderBy,
        include: options?.include,
        select: options?.select
      });

      return result as T[];
    } catch (error) {
      throw this.handleError(error, 'findMany');
    }
  }

  /**
   * Find the first entity matching the criteria
   */
  async findFirst(options?: FindOptions): Promise<T | null> {
    try {
      const result = await this.model.findFirst({
        where: options?.where,
        orderBy: options?.orderBy,
        include: options?.include,
        select: options?.select
      });

      return result as T | null;
    } catch (error) {
      throw this.handleError(error, 'findFirst');
    }
  }

  /**
   * Count entities matching the criteria
   */
  async count(where?: any): Promise<number> {
    try {
      return await this.model.count({ where });
    } catch (error) {
      throw this.handleError(error, 'count');
    }
  }

  /**
   * Check if an entity exists
   */
  async exists(where: any): Promise<boolean> {
    try {
      const count = await this.model.count({ where });
      return count > 0;
    } catch (error) {
      throw this.handleError(error, 'exists');
    }
  }

  /**
   * Create a new entity
   */
  async create(data: TCreate, options?: CreateOptions): Promise<T> {
    try {
      const result = await this.model.create({
        data,
        include: options?.include,
        select: options?.select
      });

      return result as T;
    } catch (error) {
      throw this.handleError(error, 'create');
    }
  }

  /**
   * Create multiple entities
   */
  async createMany(data: TCreate[]): Promise<{ count: number }> {
    try {
      return await this.model.createMany({ data });
    } catch (error) {
      throw this.handleError(error, 'createMany');
    }
  }

  /**
   * Update an entity by ID
   */
  async update(id: string, data: TUpdate, options?: UpdateOptions): Promise<T | null> {
    try {
      const result = await this.model.update({
        where: { id },
        data,
        include: options?.include,
        select: options?.select
      });

      return result as T;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw this.handleError(error, 'update');
    }
  }

  /**
   * Update multiple entities
   */
  async updateMany(where: any, data: TUpdate): Promise<{ count: number }> {
    try {
      return await this.model.updateMany({ where, data });
    } catch (error) {
      throw this.handleError(error, 'updateMany');
    }
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: string): Promise<T | null> {
    try {
      const result = await this.model.delete({
        where: { id }
      });

      return result as T;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw this.handleError(error, 'delete');
    }
  }

  /**
   * Delete multiple entities
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    try {
      return await this.model.deleteMany({ where });
    } catch (error) {
      throw this.handleError(error, 'deleteMany');
    }
  }

  /**
   * Upsert (create or update) an entity
   */
  async upsert(
    where: any,
    create: TCreate,
    update: TUpdate,
    options?: CreateOptions
  ): Promise<T> {
    try {
      const result = await this.model.upsert({
        where,
        create,
        update,
        include: options?.include,
        select: options?.select
      });

      return result as T;
    } catch (error) {
      throw this.handleError(error, 'upsert');
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<R>(
    fn: (tx: PrismaClient) => Promise<R>
  ): Promise<R> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      throw this.handleError(error, 'transaction');
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeRaw(query: string, ...values: any[]): Promise<any> {
    try {
      return await this.prisma.$executeRawUnsafe(query, ...values);
    } catch (error) {
      throw this.handleError(error, 'executeRaw');
    }
  }

  /**
   * Execute raw SQL query and return results
   */
  async queryRaw<R = any>(query: string, ...values: any[]): Promise<R> {
    try {
      return await this.prisma.$queryRawUnsafe(query, ...values);
    } catch (error) {
      throw this.handleError(error, 'queryRaw');
    }
  }

  /**
   * Paginate results with cursor-based pagination
   */
  async paginate(
    options: FindOptions & { pageSize?: number }
  ): Promise<{
    data: T[];
    nextCursor?: string;
    previousCursor?: string;
    hasMore: boolean;
    total: number;
  }> {
    const pageSize = options.pageSize || 20;
    const take = pageSize + 1; // Take one extra to check if there are more results

    try {
      // Get total count for metadata
      const total = await this.count(options.where);

      // Get paginated results
      const results = await this.findMany({
        ...options,
        take
      });

      const hasMore = results.length > pageSize;
      const data = hasMore ? results.slice(0, pageSize) : results;

      const nextCursor = hasMore ? data[data.length - 1].id : undefined;
      const previousCursor = options.cursor?.id;

      return {
        data,
        nextCursor,
        previousCursor,
        hasMore,
        total
      };
    } catch (error) {
      throw this.handleError(error, 'paginate');
    }
  }

  /**
   * Soft delete implementation (if the entity supports it)
   */
  async softDelete(id: string): Promise<T | null> {
    try {
      // Check if the model has deletedAt field
      const result = await this.model.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      return result as T;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw this.handleError(error, 'softDelete');
    }
  }

  /**
   * Restore a soft-deleted entity
   */
  async restore(id: string): Promise<T | null> {
    try {
      const result = await this.model.update({
        where: { id },
        data: { deletedAt: null }
      });

      return result as T;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw this.handleError(error, 'restore');
    }
  }

  /**
   * Bulk operations helper
   */
  async bulkOperation<R>(
    operation: (tx: PrismaClient) => Promise<R>,
    batchSize: number = 100
  ): Promise<R> {
    try {
      return await this.prisma.$transaction(operation, {
        maxWait: 30000, // 30 seconds
        timeout: 300000, // 5 minutes
      });
    } catch (error) {
      throw this.handleError(error, 'bulkOperation');
    }
  }

  /**
   * Handle database errors and convert to repository errors
   */
  protected handleError(error: any, operation: string): RepositoryError {
    console.error(`Repository error in ${this.entityName}.${operation}:`, error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return new RepositoryError(
            `Unique constraint violation in ${this.entityName}`,
            'UNIQUE_CONSTRAINT_VIOLATION',
            409,
            { field: error.meta?.target }
          );
        case 'P2025':
          return new RepositoryError(
            `${this.entityName} not found`,
            'NOT_FOUND',
            404,
            error.meta
          );
        case 'P2003':
          return new RepositoryError(
            `Foreign key constraint violation in ${this.entityName}`,
            'FOREIGN_KEY_VIOLATION',
            400,
            error.meta
          );
        case 'P2014':
          return new RepositoryError(
            `Invalid relation in ${this.entityName}`,
            'INVALID_RELATION',
            400,
            error.meta
          );
        default:
          return new RepositoryError(
            `Database error in ${this.entityName}: ${error.message}`,
            'DATABASE_ERROR',
            500,
            { code: error.code, meta: error.meta }
          );
      }
    }

    // Handle validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      return new RepositoryError(
        `Validation error in ${this.entityName}: ${error.message}`,
        'VALIDATION_ERROR',
        400
      );
    }

    // Handle connection errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return new RepositoryError(
        `Database connection error: ${error.message}`,
        'CONNECTION_ERROR',
        503
      );
    }

    // Handle timeout errors
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return new RepositoryError(
        `Database timeout error: ${error.message}`,
        'TIMEOUT_ERROR',
        504
      );
    }

    // Handle other repository errors
    if (error instanceof RepositoryError) {
      return error;
    }

    // Handle unknown errors
    return new RepositoryError(
      `Unknown error in ${this.entityName}.${operation}: ${error.message}`,
      'UNKNOWN_ERROR',
      500
    );
  }

  /**
   * Check if error is a "not found" error
   */
  protected isNotFoundError(error: any): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
  }

  /**
   * Validate entity data before operations
   */
  protected async validate(data: any, operation: 'create' | 'update'): Promise<void> {
    // Override in specific repositories for custom validation
  }

  /**
   * Apply default values and transformations
   */
  protected transformData(data: any, operation: 'create' | 'update'): any {
    // Override in specific repositories for custom transformations
    return data;
  }

  /**
   * Log repository operations (can be extended for better logging)
   */
  protected log(operation: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Repository ${this.entityName}.${operation}`, data || '');
    }
  }
}

/**
 * Repository factory for creating repository instances
 */
export class RepositoryFactory {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a repository instance for a specific entity
   */
  create<T extends BaseRepository<any, any, any>>(
    repositoryClass: new (prisma: PrismaClient) => T
  ): T {
    return new repositoryClass(this.prisma);
  }
}

/**
 * Repository registry for managing repository instances
 */
export class RepositoryRegistry {
  private repositories = new Map<string, BaseRepository<any, any, any>>();

  constructor(private prisma: PrismaClient) {}

  /**
   * Register a repository
   */
  register<T extends BaseRepository<any, any, any>>(
    name: string,
    repositoryClass: new (prisma: PrismaClient) => T
  ): void {
    this.repositories.set(name, new repositoryClass(this.prisma));
  }

  /**
   * Get a registered repository
   */
  get<T extends BaseRepository<any, any, any>>(name: string): T {
    const repository = this.repositories.get(name);
    if (!repository) {
      throw new Error(`Repository ${name} not found`);
    }
    return repository as T;
  }

  /**
   * Check if a repository is registered
   */
  has(name: string): boolean {
    return this.repositories.has(name);
  }

  /**
   * Get all registered repository names
   */
  getNames(): string[] {
    return Array.from(this.repositories.keys());
  }
}

export { Prisma };