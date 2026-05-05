import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  selectedPost: Post | null = null;
  selectedPostComments: AppComment[] = [];
  viewMode: 'comments' | 'likes' = 'comments';

  ngOnInit(): void {
    this.postModalService.post$.subscribe((post: Post | null) => {
      this.selectedPost = post;
      if (post) {
        this.loadCommentsForPost(post._id);
      } else {
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
        this.postService.deletePost(this.selectedPost!._id).subscribe({
          next: () => {
            this.close();
            // We might need a way to notify the caller to refresh the list
            // For now, most callers refresh on their own or we could use a global refresh event
          },
          error: (err: any) => console.error('Error deleting post:', err)
        });
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
        this.commentService.deleteComment(commentId).subscribe({
          next: () => {
            this.selectedPostComments = this.selectedPostComments.filter(c => c._id !== commentId);
            this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Error deleting comment:', err)
        });
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
    // Ensure we only return objects (populated users)
    return this.selectedPost.likes.filter(l => typeof l !== 'string');
  }
}
