import EventEmitter from 'eventemitter3';
import { createClient } from 'redis';
import { nanoid } from 'nanoid';

/**
 * SwarmEventBus - Distributed event bus for swarm coordination
 * 
 * Provides a unified event system that can work both locally
 * and distributed across multiple processes using Redis.
 */
export class SwarmEventBus {
  constructor() {
    // Local event emitter
    this.emitter = new EventEmitter();
    
    // Redis clients for pub/sub
    this.redisPublisher = null;
    this.redisSubscriber = null;
    
    // Track subscriptions
    this.subscriptions = new Map();
    
    // Generate unique instance ID
    this.instanceId = nanoid(10);
    
    // Redis connection status
    this.isRedisConnected = false;
    
    // Default channel
    this.channel = 'swarm-events';
  }

  /**
   * Initialize the event bus with optional Redis connection
   */
  async initialize(redisUrl = null) {
    try {
      if (redisUrl) {
        // Create Redis publisher client
        this.redisPublisher = createClient({ url: redisUrl });
        
        // Create separate subscriber client
        this.redisSubscriber = this.redisPublisher.duplicate();
        
        // Handle connection events
        this.redisPublisher.on('error', (err) => {
          console.error('Redis publisher error:', err);
          this.isRedisConnected = false;
        });
        
        this.redisSubscriber.on('error', (err) => {
          console.error('Redis subscriber error:', err);
          this.isRedisConnected = false;
        });
        
        // Connect both clients
        await this.redisPublisher.connect();
        await this.redisSubscriber.connect();
        
        // Subscribe to channel
        await this.redisSubscriber.subscribe(this.channel, (message) => {
          this.handleRedisMessage(message);
        });
        
        this.isRedisConnected = true;
        console.log(`SwarmEventBus initialized with Redis (instance: ${this.instanceId})`);
      } else {
        console.log(`SwarmEventBus initialized locally (instance: ${this.instanceId})`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize SwarmEventBus:', error);
      this.isRedisConnected = false;
      return false;
    }
  }

  /**
   * Publish an event to the bus
   */
  async publish(eventType, data) {
    // Always emit locally
    this.emitter.emit(eventType, data);
    
    // If Redis is connected, publish to Redis
    if (this.isRedisConnected && this.redisPublisher) {
      const event = {
        id: nanoid(),
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        sourceInstanceId: this.instanceId
      };
      
      try {
        await this.redisPublisher.publish(this.channel, JSON.stringify(event));
      } catch (error) {
        console.error('Failed to publish event to Redis:', error);
      }
    }
  }

  /**
   * Subscribe to an event
   */
  subscribe(eventType, callback) {
    // Add to local event emitter
    this.emitter.on(eventType, callback);
    
    // Track subscription
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }
    this.subscriptions.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => this.unsubscribe(eventType, callback);
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(eventType, callback) {
    // Remove from local event emitter
    this.emitter.off(eventType, callback);
    
    // Track unsubscription
    if (this.subscriptions.has(eventType)) {
      this.subscriptions.get(eventType).delete(callback);
      if (this.subscriptions.get(eventType).size === 0) {
        this.subscriptions.delete(eventType);
      }
    }
  }

  /**
   * Handle incoming Redis message
   */
  handleRedisMessage(message) {
    try {
      const event = JSON.parse(message);
      
      // Ignore events from this instance
      if (event.sourceInstanceId === this.instanceId) {
        return;
      }
      
      // Emit to local listeners
      this.emitter.emit(event.type, event.data);
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  }

  /**
   * Get list of all event types with subscriptions
   */
  getSubscribedEvents() {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get connection status
   */
  isConnected() {
    return {
      local: true,
      redis: this.isRedisConnected
    };
  }

  /**
   * Close connections
   */
  async close() {
    // Clear all subscriptions
    this.emitter.removeAllListeners();
    this.subscriptions.clear();
    
    // Close Redis connections if active
    if (this.redisSubscriber) {
      try {
        await this.redisSubscriber.unsubscribe(this.channel);
        await this.redisSubscriber.quit();
      } catch (err) {
        console.error('Error closing Redis subscriber:', err);
      }
    }
    
    if (this.redisPublisher) {
      try {
        await this.redisPublisher.quit();
      } catch (err) {
        console.error('Error closing Redis publisher:', err);
      }
    }
    
    this.isRedisConnected = false;
  }
}