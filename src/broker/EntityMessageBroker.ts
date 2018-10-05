import { Observable, Subject } from 'rxjs';
import { filter, mergeAll, share } from 'rxjs/operators';
import { EndlessReplaySubject, findSubjectByName, compareTopics } from './EntityMessageBrokerUtils';

export class EntityMessageBroker {
  private static _instance: EntityMessageBroker = new EntityMessageBroker();
  private readonly subjects: Subject<any>[] = [];
  /**
   * Message bus
   */
  private readonly messageBus: EndlessReplaySubject<any> = new EndlessReplaySubject<any>();
  /**
   * Permanent message bus stream as Observable
   */
  private readonly messageStream: Observable<any> = this.messageBus.pipe(share());

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
   * @param  event           Topic Event
   * @example
   * const broker = EntityMessageBroker.getInstance();
   * const subject = broker.emit('test.topic', data);
   */
  emit(topic: string, data: any = {}): Subject<any> {
    const subject = this.subject(topic);
    subject.next(data);
    return subject;
  }

  /**
   * Returns EndlessSubject representing given topic
   * @param  name           Topic name
   * @example
   * const broker = EntityMessageBroker.getInstance();
   * const subject = broker.subject('test.topic');
   */
  subject(name: any): Subject<any> {
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
   * @param  name        Topic name / pattern
   * @return Rx.Observable for given set of topics
   * @example
   * const broker = EntityMessageBroker.getInstance();
   * broker.on('Candidate.child_added')
   *       .subscribe((res) => { // default Observable subscription
   *            // handle results
   *       });
   */
  on(name: any): Observable<any> {
    // Create new topic if it's plain text
    if (name.indexOf('#') === -1 && name.indexOf('*') === -1) {
      return this.subject(name);
    }
    // Return stream
    return this.messageStream.pipe(
      filter((obs) => compareTopics(obs.name, name)),
      mergeAll(),
    );
  }
}
