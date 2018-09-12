import { AxiosInstance, AxiosResponse } from 'axios';
// Lib
import { Staffing } from './Staffing';
import { BullhornSubscriptionResponse, BullhornSubscriptionEvent } from '../types';
import { EntityMessageBroker } from '../broker';

/**
 * A Class that defines the base Entity Model
 * @example
 * ```
 * //Most methods on the entity are fluent (chainable)
 * var job = new Entity('JobOrder').fields('title');
 * //the 'fields' function created a getter and setter for 'title'
 * job.title = 'My New Job';
 * job.save();
 * ```
 */
export class EntitySubscription {
  http: AxiosInstance;
  // Subscription Type
  public readonly subscriptionType: string = 'entity';
  // Fields associated with this Entity
  public readonly eventTypes: string[] = ['INSERTED', 'UPDATED', 'DELETED'];
  // EntityBroker
  protected broker: EntityMessageBroker = EntityMessageBroker.getInstance();
  public _lastRequestId: number = 0;
  /**
   * constructor
   * @param  subscriptionId name of the subscription
   * @param  types List of Entity events to listen to
   */
  constructor(private readonly subscriptionId: string, public types: string[] = []) {
    this.http = Staffing.http();
    this._setUpObservable().catch(() => console.error('Error in Subscription'));
  }

  get endpoint(): string {
    return `event/subscription/${this.subscriptionId}`;
  }

  async subscribe(): Promise<BullhornSubscriptionResponse> {
    const response: AxiosResponse = await this.http.put(this.endpoint, {
      params: {
        type: this.subscriptionType,
        eventTypes: this.eventTypes,
        names: this.types,
      },
    });
    return response.data;
  }

  async unsubscribe(): Promise<BullhornSubscriptionResponse> {
    const response: AxiosResponse = await this.http.delete(this.endpoint);
    return response.data;
  }
  /**
   * Make http request to get entity. Objects 'data' property will be set to response, then promise will be resolved.
   * @param id - Id of the Model to retrieve
   */
  async get(): Promise<BullhornSubscriptionEvent[]> {
    const response: AxiosResponse = await this.http.get(this.endpoint, {
      params: {
        maxEvents: 100,
      },
    });
    this._lastRequestId = response.data.requestId;
    return response.data.events;
  }

  private async _setUpObservable() {
    await this.unsubscribe();
    await this.subscribe();
    setInterval(async () => {
      const events: BullhornSubscriptionEvent[] = await this.get();
      for (const evt of events) {
        this.broker.emit(`${evt.entityName}:${evt.entityId}:invalidate`, evt);
      }
    }, 5000);
  }
}
