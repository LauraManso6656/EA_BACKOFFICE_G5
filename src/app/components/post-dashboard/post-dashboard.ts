import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { Post, Comment } from '../../models/post';
import { PostService } from '../../services/post-service';
import { StatsService } from '../../services/stats-service';
import { PostModalService } from '../../services/post-modal-service';
import { Navbar } from '../navbar/navbar';
import { ConfirmService } from '../../services/confirm-service';

@Component({
  selector: 'app-post-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Navbar],
  templateUrl: './post-dashboard.html',
  styleUrl: './post-dashboard.css',
})
export class PostDashboard implements OnInit {
  posts: Post[] = [];
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  totalPostsCount = 0;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalDocs = 0;

  private platformId = inject(PLATFORM_ID);
  private postModalService = inject(PostModalService);

  constructor(
    private postService: PostService,
    private statsService: StatsService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.load();

      this.searchControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => {
          this.currentPage = 1;
          this.load();
        });
    }
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    const searchTerm = this.searchControl.value ?? '';
    this.postService.getPosts(this.currentPage, this.pageSize, searchTerm).subscribe({
      next: (res) => {
        this.posts = res.docs;
        this.totalPages = res.totalPages;
        this.totalDocs = res.totalDocs;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Error loading posts.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    // Estadísticas
    this.statsService.getPostCount().subscribe({
      next: (res) => {
        this.totalPostsCount = res.count;
        this.cdr.detectChanges();
      },
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.load();
    }
  }

  openPostDetailModal(post: Post): void {
    this.postModalService.open(post);
  }

  openDeleteModal(post: Post): void {
    this.confirmService.ask({
      title: 'Delete Post?',
      message: `You are about to permanently delete this post. This action will also delete all its comments and cannot be undone.`,
      type: 'post',
      confirmText: 'Delete',
      onConfirm: () => {
        this.postService.deletePost(post._id).subscribe({
          next: () => {
            this.load();
          },
          error: (err) => console.error('Error deleting post:', err),
        });
      },
    });
  }

  getAuthorName(post: Post): string {
    if (!post || !post.usuario) return 'Unknown User';
    return typeof post.usuario === 'object'
      ? (post.usuario as any).nombre
      : 'User ID: ' + post.usuario;
  }

  getAuthorInitial(post: Post): string {
    const name = this.getAuthorName(post);
    return name.substring(0, 2).toUpperCase();
  }

  getPopulatedComments(post: Post | null): Comment[] {
    if (!post || !post.comments) return [];
    // Filtramos los que son objetos (Comment) y no IDs (string)
    return post.comments.filter((c) => typeof c !== 'string') as Comment[];
  }
}
