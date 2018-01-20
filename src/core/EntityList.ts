import { BullhornListResponse } from './../types/Responses';
import { Observable } from 'rxjs/Observable';
import { StatefulSubject } from './StatefulSubject';
import { Entity } from './Entity';
import { QueryService, SearchService } from '../services';
import { EntityListOptions, observeListOptions } from './EntityListOptions'
import { EntityMessageBroker } from '../broker'
import { is, can } from '../utils';

export type EntityListReference<T> = SearchService<T> | QueryService<T>;
export type EntityOperation = number | Entity<any>;

export interface ListResults {
    start: number;
    count: number;
    data: any[];
    total?: number;
}

export class EntityList<T> extends StatefulSubject<T[]> {

    static useSearch: boolean = false;
    // Name of Entity
    public type: string;
    public descriptor: any;
    private $latest: BullhornListResponse<T>;
    private $ref: Entity<T>;
    private $list: EntityListReference<T>;
    protected broker: EntityMessageBroker = EntityMessageBroker.getInstance()

    constructor(type: string, options: EntityListOptions = {}, state?: T[]) {
        super(state);
        this.type = type;
        this.$ref = new Entity<T>(this.type, {} as T);
        this.$list = this.getSearcher(this.type);
        observeListOptions(options).subscribe((params) => {
            if (params) {
                for (let key of Object.keys(params)) {
                    switch (key) {
                        case 'fields':
                            this.$list.fields(params.fields);
                            break;
                        case 'layout':
                            this.$list.params({ layout: params.layout });
                            break;
                        case 'meta':
                            this.$list.meta.style(params.meta);
                            break;
                        case 'orderBy':
                            this.$list.sort(params.orderBy);
                            break;
                        case 'startAt':
                            this.$list.params({ start: params.startAt });
                            break;
                        case 'limitTo':
                            this.$list.count(params.limitTo || 25);
                            break;
                        case 'filter':
                            this.$list.where(params.filter);
                            break;
                        case 'params':
                            this.$list.params(params.params);
                            break;
                    }
                }
            }
            this.$list.then((results: BullhornListResponse<T>) => {
                this.descriptor = results.meta;
                this.$latest = results;
                this.next(results.data);
            });
        });
        this._setUpObservable();

    }

    protected getSearcher(type: string): EntityListReference<T> {
        if (['Candidate', 'ClientContact', 'ClientCorporation', 'JobOrder', 'Lead', 'Opportunity', 'Placement', 'JobSubmission', 'Note', 'UserMessage'].indexOf(type) >= 0) {
            return new SearchService(this.type);
        }
        return new QueryService(this.type);
    }

    get lastAdded(): Entity<T> {
        return this.$ref;
    }

    get info(): any {
        return {
            total: this.$latest.total,
            messages: this.$latest.messages,
            start: this.$latest.start,
            count: this.$latest.count,
        }
    }
    
    find(pk: number): Entity<T> {
        let found: any = this.getValue().find((item: any) => item.id === pk);
        if (found) {
            return found;
        }
        return new Entity<T>(this.type, { id: pk });
    }

    push(item: T): Promise<any> {
        return this.$ref.set(item).save().then(this._eventHook('child_added'));
    }

    update(item: EntityOperation, value: T): Promise<any> {
        return this._checkOperationCases(item, {
            keyCase: () => this.find(<number>item).patch(value).save(),
            entityCase: () => (<Entity<any>>item).patch(value).save()
        }).then(this._eventHook('child_updated'));
    }

    remove(item: EntityOperation): Promise<any> {
        return this._checkOperationCases(item, {
            keyCase: () => this.find(<number>item).remove(),
            entityCase: () => (<Entity<any>>item).remove()
        }).then(this._eventHook('child_removed'));
    }

    private _setUpObservable() {
        const refresh = (value) => {
            this.$list.then((results: BullhornListResponse<T>) => {
                this.descriptor = results.meta;
                this.next(results.data);
            });
        }
        this.broker.on(`${this.type}:*`).subscribe(refresh);
        // this.broker.on(`${this.type}:child_added`).subscribe(refresh);
        // this.broker.on(`${this.type}:child_removed`).subscribe(refresh);
        // this.broker.on(`${this.type}:child_updated`).subscribe(refresh);
    }

    private _eventHook(eventType: string) {
        return (result) => {
            this.broker.emit(`${this.type}:${result.changedEntityId}:value`, result.data);
            this.broker.emit(`${this.type}:${eventType}`, result.data);
            return result;
        }
    }

    private _checkOperationCases(item: EntityOperation, cases: any): Promise<void> {
        if (is(item).aNumber) {
            return cases.keyCase();
        } else if (is(item).aTypeOf(Entity)) {
            return cases.entityCase();
        }
        throw new Error(`Method requires a key or reference. Got: ${typeof item}`);
    }
}