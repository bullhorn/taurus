import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeAll';
import { EndlessReplaySubject, findSubjectByName, compareTopics } from './EntityMessageBrokerUtils'

export class EntityMessageBroker {

    private static _instance: EntityMessageBroker = new EntityMessageBroker();
    private subjects: Subject<any>[] = [];
    /**
     * Message bus
     * @type {EndlessReplaySubject}
     * @private
     */
    private messageBus:EndlessReplaySubject<any> = new EndlessReplaySubject<any>();
    /**
     * Permanent message bus stream as Observable
     * @type {Observable}
     * @private
     */
    private messageStream:Observable<any> = this.messageBus.share();

    constructor() {
        if (EntityMessageBroker._instance) {
            throw new Error('Error: Instantiation failed: Use EntityMessageBroker.getInstance() instead of new.');
        }
        EntityMessageBroker._instance = this;
    }

    public static getInstance(): EntityMessageBroker {
        return EntityMessageBroker._instance;
    }

    /**
     * Returns EndlessSubject representing given topic
     * @param  {EntityMessageEvent}         event           Topic Event
     * @return {Subject}             Subject representing given topic
     * @example
     * const broker = EntityMessageBroker.getInstance();
     * const subject = broker.emit('test.topic', data);
     */
    emit(topic:string, data:any = {}):Subject<any> {
        let subject = this.subject(topic);
        subject.next(data);
        return subject;
    }
    
    /**
     * Returns EndlessSubject representing given topic
     * @param  {String}         name           Topic name
     * @example
     * const broker = EntityMessageBroker.getInstance();
     * const subject = broker.subject('test.topic');
     */
    subject(name: any):Subject<any> {
        let s = findSubjectByName(this.subjects, name);
        if (!s) {
            s = new Subject();
            s.name = name;
            this.subjects.push(s);
            this.messageBus.next(s);
        }
        return s;
    }

    /**
     * Get an Observable for specific set of topics
     * @param  {String}         name        Topic name / pattern
     * @return {Rx.Observable}              Rx.Observable for given set of topics
     * @example
     * const broker = EntityMessageBroker.getInstance();
     * broker.on('Candidate.child_added')
     *       .subscribe((res) => { // default Observable subscription
     *            // handle results
     *       });
     */
    on(name: any):Observable<any> {
        // create new topic if it's plain text
        if (name.indexOf('#') === -1 && name.indexOf('*') === -1) {
            return this.subject(name);
        }
        // return stream
        return this.messageStream.filter((obs) => compareTopics(obs.name, name)).mergeAll();
    }

}
