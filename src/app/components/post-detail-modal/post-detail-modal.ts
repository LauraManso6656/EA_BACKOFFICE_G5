import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { tap } from 'rxjs';
import { Post } from '../../models/post';
import { PostModalService } from '../../services/post-modal-service';
import { CommentService } from '../../services/comment-service';
import { PostService } from '../../services/post-service';
import { Comment as AppComment } from '../../models/comment';
import { ConfirmService } from '../../services/confirm-service';

@Component({
  selector: 'app-post-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-detail-modal.html',
  styleUrl: './post-detail-modal.css'
})
export class PostDetailModal implements OnInit {
  private postModalService = inject(PostModalService);
  private commentService = inject(CommentService);
  private postService = inject(PostService);
  private confirmService = inject(ConfirmService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  selectedPost: Post | null = null;
  selectedPostComments: AppComment[] = [];
  viewMode: 'comments' | 'likes' = 'comments';

  ngOnInit(): void {
    this.postModalService.post$.subscribe((post: Post | null) => {
      if (post) {
        // Recargamos el post completo del servidor para asegurar que los likes vienen poblados
        this.postService.getPost(post._id).subscribe({
          next: (fullPost) => {
            this.selectedPost = fullPost;
            this.loadCommentsForPost(post._id);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error reloading post details:', err);
            this.selectedPost = post; // Fallback al post original
            this.loadCommentsForPost(post._id);
          }
        });
      } else {
        this.selectedPost = null;
        this.selectedPostComments = [];
      }
      this.cdr.detectChanges();
    });
  }

  close(): void {
    this.postModalService.close();
    this.viewMode = 'comments'; // Reset mode on close
  }

  setViewMode(mode: 'comments' | 'likes'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  loadCommentsForPost(postId: string): void {
    this.commentService.getCommentsFromPost(postId).subscribe({
      next: (comments: AppComment[]) => {
        this.selectedPostComments = comments;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading post comments:', err)
    });
  }

  deletePost(): void {
    if (!this.selectedPost) return;

    this.confirmService.ask({
      title: 'Delete Post?',
      message: 'You are about to delete this content permanently. This action cannot be undone.',
      type: 'post',
      confirmText: 'Delete',
      onConfirm: () => {
        return this.postService.deletePost(this.selectedPost!._id).pipe(
          tap(() => this.close())
        );
      }
    });
  }

  deleteComment(commentId: string): void {
    this.confirmService.ask({
      title: 'Delete Comment?',
      message: 'The comment will be removed permanently. This action cannot be undone.',
      type: 'comment',
      confirmText: 'Delete',
      onConfirm: () => {
        return this.commentService.deleteComment(commentId).pipe(
          tap(() => {
            this.selectedPostComments = this.selectedPostComments.filter(c => c._id !== commentId);
            this.cdr.detectChanges();
          })
        );
      }
    });
  }

  getAuthorName(): string {
    if (!this.selectedPost?.usuario) return 'Member';
    if (typeof this.selectedPost.usuario === 'string') return 'Member';
    return this.selectedPost.usuario.nombre || 'Member';
  }

  getAuthorInitial(): string {
    return this.getAuthorName().substring(0, 2).toUpperCase();
  }

  getCommentAuthorName(comment: AppComment): string {
    if (!comment.usuario) return 'Member';
    if (typeof comment.usuario === 'string') return 'Member';
    return comment.usuario.nombre || 'Member';
  }

  getCommentAuthorInitial(comment: AppComment): string {
    return this.getCommentAuthorName(comment).substring(0, 1).toUpperCase();
  }

  getLikers(): any[] {
    if (!this.selectedPost?.likes) return [];
    
    return this.selectedPost.likes.map(l => {
      if (typeof l === 'string') {
        return { _id: l, nombre: 'User ' + l.substring(0, 4) };
      }
      return l;
    });
  }

  openUserDetail(userId: string): void {
    if (!userId) return;
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/usuario', userId])
    );
    window.open(url, '_blank');
  }

  getAuthorId(): string {
    if (!this.selectedPost?.usuario) return '';
    return typeof this.selectedPost.usuario === 'string' 
      ? this.selectedPost.usuario 
      : this.selectedPost.usuario._id;
  }

  getCommentAuthorId(comment: AppComment): string {
    if (!comment.usuario) return '';
    return typeof comment.usuario === 'string' 
      ? comment.usuario 
      : comment.usuario._id;
  }
}
