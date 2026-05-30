import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Post } from '../models/post';

@Injectable({
  providedIn: 'root',
})
export class PostModalService {
  private postSubject = new Subject<Post | null>();
  post$ = this.postSubject.asObservable();

  open(post: Post): void {
    this.postSubject.next(post);
  }

  close(): void {
    this.postSubject.next(null);
  }
}
