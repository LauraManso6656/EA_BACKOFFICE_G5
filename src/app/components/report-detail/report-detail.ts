import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../services/report-service';
import { Report } from '../../models/report';
import { Post } from '../../models/post';
import { PostService } from '../../services/post-service';
import { Comment as AppComment } from '../../models/comment';
import { CommentService } from '../../services/comment-service';
import { Navbar } from '../navbar/navbar';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { ConfirmService } from '../../services/confirm-service';
import { PostModalService } from '../../services/post-modal-service';
import { PostDetailModal } from '../post-detail-modal/post-detail-modal';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, PostDetailModal],
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.css'
})
export class ReportDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private reportService = inject(ReportService);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private postService = inject(PostService);
  private commentService = inject(CommentService);

  report = signal<Report | null>(null);
  targetData = signal<any>(null);
  loading = signal(true);
  isDeleting = false;
  error = signal<string | null>(null);
  highlightedMessageId = signal<string | null>(null);

  // Stats para la sidebar
  targetStats = signal<{ label: string, value: any }[]>([]);

  // --- MODAL DE ALERTAS GENÉRICO ---
  private confirmService = inject(ConfirmService);
  private postModalService = inject(PostModalService);

  private router = inject(Router);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.loadReport(params['id']);
        }
      });
    }
  }

  loadReport(id: string): void {
    this.loading.set(true);
    this.reportService.getReport(id).subscribe({
      next: (report) => {
        this.report.set(report);
        this.fetchTargetDetails(report);
      },
      error: (err) => {
        console.error('Error loading report:', err);
        this.loading.set(false);
        this.error.set('Could not load report details');
      }
    });
  }

  conversation = signal<any[]>([]);

  fetchTargetDetails(report: Report): void {
    let endpoint = '';
    const baseUrl = 'http://localhost:1337';

    if (report.tipo === 'user') endpoint = `${baseUrl}/usuarios/${report.objetivoId}`;
    else if (report.tipo === 'post') endpoint = `${baseUrl}/posts/${report.objetivoId}`;
    else if (report.tipo === 'comment') endpoint = `${baseUrl}/comments/${report.objetivoId}`;
    else if (report.tipo === 'chat') endpoint = `${baseUrl}/chat/message/${report.objetivoId}`;

    if (!endpoint) {
      this.loading.set(false);
      return;
    }

    this.http.get(endpoint).pipe(
      catchError(err => {
        console.error('Error fetching target details:', err);
        return of(null);
      })
    ).subscribe(data => {
      this.targetData.set(data);
      this.prepareStats(report, data);

      if (report.tipo === 'chat' && data) {
        // Fetch context history
        const chatData = data as any;
        const userA = chatData.remitente?._id || chatData.remitente;
        const userB = chatData.destinatario?._id || chatData.destinatario;
        this.http.get<any[]>(`${baseUrl}/chat/context/${userA}/${userB}`).subscribe({
          next: (messages) => {
            this.conversation.set(messages);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error fetching chat context:', err);
            this.loading.set(false);
          }
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  prepareStats(report: Report, data: any): void {
    if (!data) {
      this.targetStats.set([]);
      return;
    }

    const stats: { label: string, value: any }[] = [];

    if (report.tipo === 'user') {
      stats.push({ label: 'Full Name', value: data.nombre });
      stats.push({ label: 'Email', value: data.email });
      stats.push({ label: 'Role', value: data.rol });
    } else if (report.tipo === 'post') {
      stats.push({ label: 'Likes', value: data.likes?.length || 0 });
      stats.push({ label: 'Comments', value: data.comments?.length || 0 });
      stats.push({ label: 'Has Image', value: data.imageUrl ? 'Yes' : 'No' });
    } else if (report.tipo === 'comment') {
      stats.push({ label: 'Writer', value: data.usuario?.nombre || 'Unknown' });
      stats.push({ label: 'Length', value: `${data.texto?.length || 0} chars` });
    } else if (report.tipo === 'chat') {
      stats.push({ label: 'Sender', value: data.remitente?.nombre || 'Unknown' });
      stats.push({ label: 'Receiver', value: data.destinatario?.nombre || 'Unknown' });
      stats.push({ label: 'Length', value: `${data.contenido?.length || 0} chars` });
    }

    this.targetStats.set(stats);
  }

  updateStatus(newStatus: string): void {
    const currentReport = this.report();
    if (!currentReport) return;

    this.reportService.updateReportStatus(currentReport._id, newStatus).subscribe({
      next: (updated) => {
        this.report.set(updated);
      },
      error: (err) => console.error('Error updating status:', err)
    });
  }

  deleteReport(): void {
    const current = this.report();
    if (!current) return;

    this.confirmService.ask({
      title: 'Delete Report?',
      message: 'Are you sure you want to delete this report record? This action is permanent.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        this.reportService.deleteReport(current._id).subscribe({
          next: () => this.router.navigate(['/reports']),
          error: (err) => console.error('Error deleting report:', err)
        });
      }
    });
  }

  getAuthorName(): string {
    const r = this.report();
    if (!r || !r.usuarioReporta) return 'System';
    if (typeof r.usuarioReporta === 'string') return 'Anonymous';
    return r.usuarioReporta.nombre || 'Unknown';
  }

  getReporterId(): string {
    const r = this.report();
    if (!r || !r.usuarioReporta) return '';
    if (typeof r.usuarioReporta === 'string') return r.usuarioReporta;
    return r.usuarioReporta._id || '';
  }

  // --- Lógica Unificada de Modals ---
  openConfirmModal(id: string, type: 'post' | 'comment'): void {
    this.confirmService.ask({
      title: type === 'post' ? 'Delete Post?' : 'Delete Comment?',
      message: type === 'post' 
        ? 'You are about to delete this content permanently. This action cannot be undone.' 
        : 'The comment will be removed permanently. This action cannot be undone.',
      type: type,
      confirmText: 'Delete',
      onConfirm: () => {
        if (type === 'post') {
          this.postService.deletePost(id).subscribe({
            next: () => {
              this.loadReport(this.report()?._id || '');
            },
            error: (err: any) => console.error('Error deleting post:', err)
          });
        } else {
          this.commentService.deleteComment(id).subscribe({
            next: () => {
              if (id === this.report()?.objetivoId) {
                this.loadReport(this.report()?._id || '');
              }
              this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error deleting comment:', err)
          });
        }
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  }

  // --- MODAL DETALLE POST ---
  openPostDetailModal(post: any): void {
    if (!post) return;
    
    // Si el post es solo un ID (string), cargamos el objeto completo primero
    if (typeof post === 'string') {
      this.postService.getPost(post).subscribe({
        next: (fullPost) => this.postModalService.open(fullPost),
        error: (err) => console.error('Error loading post before modal:', err)
      });
    } else {
      // Si ya es un objeto, lo pasamos directamente
      this.postModalService.open(post);
    }
  }

  openPostFromComment(): void {
    const comment = this.targetData();
    if (!comment || !comment.post) return;

    const postId = typeof comment.post === 'string' ? comment.post : comment.post._id;
    this.postService.getPost(postId).subscribe({
      next: (post: Post) => {
        this.openPostDetailModal(post);
      },
      error: (err: any) => console.error('Error loading post from comment:', err)
    });
  }

  getCommentAuthorName(comment: any): string {
    if (!comment.usuario) return 'Member';
    if (typeof comment.usuario === 'string') return 'Member';
    return comment.usuario.nombre || 'Member';
  }

  getAuthorInitial(comment: any): string {
    const name = this.getCommentAuthorName(comment);
    return name.substring(0, 1).toUpperCase();
  }

  scrollToMessage(messageId: string): void {
    if (!isPlatformBrowser(this.platformId) || !messageId) return;

    const element = document.getElementById('msg-' + messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightedMessageId.set(messageId);
      
      setTimeout(() => {
        if (this.highlightedMessageId() === messageId) {
          this.highlightedMessageId.set(null);
        }
      }, 1500);
    }
  }

  getParentAuthor(msg: any): string {
    if (!msg.parentMessage) return '';
    
    // Si viene poblado del backend
    if (msg.parentMessage.remitente?.nombre) {
      return msg.parentMessage.remitente.nombre;
    }
    
    // Si no, lo buscamos en la lista actual por ID
    const parentId = typeof msg.parentMessage === 'string' ? msg.parentMessage : msg.parentMessage._id;
    const parent = this.conversation().find(m => m._id === parentId);
    
    if (parent && parent.remitente?.nombre) {
      return parent.remitente.nombre;
    }
    
    return 'Deleted user';
  }
}
