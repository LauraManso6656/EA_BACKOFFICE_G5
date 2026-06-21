import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario-service';
import { UniversidadService } from '../../services/universidad-service';
import { Universidad } from '../../models/universidad';
import { Usuario } from '../../models/usuario';
import { Post } from '../../models/post';
import { PostService } from '../../services/post-service';
import { Comment as AppComment } from '../../models/comment';
import { CommentService } from '../../services/comment-service';
import { ReportService } from '../../services/report-service';
import { Report } from '../../models/report';
import { ConfirmService } from '../../services/confirm-service';
import { PostModalService } from '../../services/post-modal-service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetail implements OnInit {
  userForm: FormGroup;
  isEditing = false;
  userId: string | null = null;
  usuario?: Usuario;
  universidades: Universidad[] = [];
  filteredUniversidades: Universidad[] = [];
  universidadSearch = new FormControl('');
  showUniversidadesDropdown = false;

  // Nueva lógica de pestañas, posts y comentarios
  activeTab: 'profile' | 'posts' | 'comments' | 'reports' | 'unimatch' = 'profile';
  userPosts: Post[] = [];
  userComments: AppComment[] = [];
  userReports: Report[] = [];
  unimatchPhotos: any[] = [];

  // Pagination for tabs
  postsPage = 1;
  postsTotalPages = 1;
  postsTotalDocs = 0;
  commentsPage = 1;
  commentsTotalPages = 1;
  commentsTotalDocs = 0;
  reportsPage = 1;
  reportsTotalPages = 1;
  reportsTotalDocs = 0;
  pageSize = 5; // Smaller page size for detail view tabs

  // --- MODAL DE ALERTAS GENÉRICO ---
  private confirmService = inject(ConfirmService);
  private postModalService = inject(PostModalService);



  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private universidadService: UniversidadService,
    private postService: PostService,
    private commentService: CommentService,
    private reportService: ReportService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private confirmServiceInject: ConfirmService // inject() is used above but let's be consistent if needed. Actually inject is fine.
  ) {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['user', Validators.required],
      universidad: [''],
      password: [''],
      privado: [false]
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.loadUniversidades();
    if (this.userId) {
      this.loadUser();
      this.loadUserPosts();
      this.loadUserComments();
      this.loadUserReports();
      this.loadUnimatchPhotos();
    }

    this.universidadSearch.valueChanges.subscribe(value => {
      if (!value || value.trim() === '') {
        this.userForm.patchValue({ universidad: null });
      }
      this.filterUniversidades(value || '');
    });
  }

  setActiveTab(tab: 'profile' | 'posts' | 'comments' | 'reports' | 'unimatch'): void {
    this.activeTab = tab;
  }

  loadUserReports(): void {
    if (!this.userId) return;
    this.reportService.getReportsForUser(this.userId, this.reportsPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.userReports = res.docs || [];
        this.reportsTotalPages = res.totalPages || 1;
        this.reportsTotalDocs = res.totalDocs || 0;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading user reports:', err)
    });
  }

  loadUserComments(): void {
    if (!this.userId) return;
    this.commentService.getCommentsFromUser(this.userId, this.commentsPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.userComments = res.docs || [];
        this.commentsTotalPages = res.totalPages || 1;
        this.commentsTotalDocs = res.totalDocs || 0;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading user comments:', err)
    });
  }

  loadUserPosts(): void {
    if (!this.userId) return;
    this.postService.getPostsFromUser(this.userId, this.postsPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.userPosts = res.docs || [];
        this.postsTotalPages = res.totalPages || 1;
        this.postsTotalDocs = res.totalDocs || 0;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading user posts:', err)
    });
  }

  changePostsPage(page: number): void {
    if (page >= 1 && page <= this.postsTotalPages) {
      this.postsPage = page;
      this.loadUserPosts();
    }
  }

  changeCommentsPage(page: number): void {
    if (page >= 1 && page <= this.commentsTotalPages) {
      this.commentsPage = page;
      this.loadUserComments();
    }
  }

  changeReportsPage(page: number): void {
    if (page >= 1 && page <= this.reportsTotalPages) {
      this.reportsPage = page;
      this.loadUserReports();
    }
  }

  // --- Lógica Unificada de Modals ---
  openConfirmModal(id: string, type: 'post' | 'comment'): void {
    this.confirmService.ask({
      title: type === 'post' ? 'Delete Post?' : 'Delete Comment?',
      message: type === 'post' 
        ? 'You are about to permanently delete this content. This action cannot be undone.' 
        : 'The comment will be permanently removed. This action cannot be undone.',
      type: type,
      confirmText: 'Delete',
      onConfirm: () => {
        if (type === 'post') {
          this.postService.deletePost(id).subscribe({
            next: () => {
              this.userPosts = this.userPosts.filter((p: Post) => p._id !== id);
              this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error deleting post:', err)
          });
        } else {
          this.commentService.deleteComment(id).subscribe({
            next: () => {
              this.userComments = this.userComments.filter((c: AppComment) => c._id !== id);
              this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error deleting comment:', err)
          });
        }
      }
    });
  }

  // --- MODAL DETALLE POST ---
  openPostDetailModal(post: Post): void {
    this.postModalService.open(post);
  }

  openPostFromComment(comment: AppComment): void {
    const postId = typeof comment.post === 'string' ? comment.post : comment.post._id;
    if (!postId) return;

    this.postService.getPost(postId).subscribe({
      next: (post: Post) => {
        this.openPostDetailModal(post);
      },
      error: (err: any) => console.error('Error loading post from comment:', err)
    });
  }

  getAuthorName(comment: any): string {
    if (!comment.usuario) return 'Miembro';
    if (typeof comment.usuario === 'string') return 'Miembro';
    return comment.usuario.nombre || 'Miembro';
  }

  getAuthorInitial(comment: any): string {
    const name = this.getAuthorName(comment);
    return name.substring(0, 1).toUpperCase();
  }

  filterUniversidades(query: string): void {
    const term = query.toLowerCase();
    this.filteredUniversidades = this.universidades.filter(u =>
      u.nombre.toLowerCase().includes(term)
    );
  }

  selectUniversidad(uni: Universidad | null): void {
    if (uni === null) {
      this.userForm.patchValue({ universidad: null });
      this.universidadSearch.setValue('Sin Universidad', { emitEvent: false });
    } else {
      this.userForm.patchValue({ universidad: uni._id });
      this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
    }
    this.showUniversidadesDropdown = false;
  }

  getUniversidadNombre(id: string): string {
    const uni = this.universidades.find(u => u._id === id);
    return uni ? uni.nombre : '';
  }

  loadUniversidades(): void {
    this.universidadService.getUniversidades(1, 1000).subscribe({
      next: (res: any) => {
        const data: Universidad[] = res.docs || [];
        this.universidades = data;
        this.filteredUniversidades = data;
      },
      error: (err: any) => console.error('Error loading universities:', err)
    });
  }

  loadUser(): void {
    this.usuarioService.getUsuario(this.userId!).subscribe({
      next: (user: Usuario) => {
        this.usuario = user;
        this.userForm.patchValue({
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          universidad: user.universidad?._id || user.universidad,
          password: '',
          privado: user.privado || false
        });

        const uniId = user.universidad?._id || user.universidad;
        if (uniId) {
          const uni = this.universidades.find(u => u._id === uniId);
          if (uni) this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
        }

        this.userForm.disable();
        this.universidadSearch.disable();
      },
      error: (err: any) => console.error('Error loading user:', err)
    });
  }

  toggleEdit(): void {
    this.isEditing = true;
    this.userForm.enable();
    this.universidadSearch.enable();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.userForm.disable();
    this.universidadSearch.disable();
    if (this.usuario) {
      const uniId = this.usuario.universidad?._id || this.usuario.universidad;
      this.userForm.patchValue({
        nombre: this.usuario.nombre,
        email: this.usuario.email,
        rol: this.usuario.rol,
        universidad: uniId,
        password: '',
        privado: this.usuario.privado || false
      });

      if (uniId) {
        const uni = this.universidades.find(u => u._id === uniId);
        if (uni) this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
      }
    }
  }

  saveChanges(): void {
    if (this.userForm.invalid) {
      return;
    }

    if (this.userId) {
      const dataToUpdate = { ...this.userForm.value };
      
      // Asegurar que si la universidad está vacía se envíe null para borrarla en DB
      if (!dataToUpdate.universidad || dataToUpdate.universidad === '') {
        dataToUpdate.universidad = null;
      }

      if (!dataToUpdate.password || dataToUpdate.password.trim() === '') {
        delete dataToUpdate.password;
      }

      this.usuarioService.updateUsuario(this.userId, dataToUpdate).subscribe({
        next: (updatedUser: Usuario) => {
          this.usuario = updatedUser;
          this.isEditing = false;
          this.userForm.disable();
          this.universidadSearch.disable();
          this.userForm.patchValue({ password: '' });
        },
        error: (err: any) => {
          console.error('Error al actualizar usuario:', err);
        }
      });
    }
  }

  loadUnimatchPhotos(): void {
    if (!this.userId) return;
    this.usuarioService.getUnimatchPhotos(this.userId).subscribe({
      next: (photos) => {
        this.unimatchPhotos = photos || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading unimatch photos:', err)
    });
  }

  deleteUnimatchPhoto(photoId: string): void {
    this.confirmService.ask({
      title: 'Delete UniMatch Photo?',
      message: 'Are you sure you want to permanently delete this photo? This action cannot be undone.',
      type: 'comment',
      confirmText: 'Delete',
      onConfirm: () => {
        this.usuarioService.deleteUnimatchPhoto(photoId).subscribe({
          next: () => {
             this.unimatchPhotos = this.unimatchPhotos.filter(p => p._id !== photoId);
             this.cdr.detectChanges();
          },
          error: (err) => console.error('Error deleting unimatch photo:', err)
        });
      }
    });
  }

  showProfileDropdown = false;

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
