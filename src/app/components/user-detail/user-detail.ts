import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario-service';
import { UniversidadService } from '../../services/universidad-service';
import { Universidad } from '../../models/universidad';
import { Usuario } from '../../models/usuario';
import { Post } from '../../models/post';
import { PostService } from '../../services/post-service';

import { Comment } from '../../models/comment';
import { CommentService } from '../../services/comment-service';

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
  activeTab: 'profile' | 'posts' | 'comments' = 'profile';
  userPosts: Post[] = [];
  userComments: Comment[] = [];

  // --- MODAL DE ALERTAS GENÉRICO ---
  showConfirmModal = false;
  confirmModalConfig = {
    title: '',
    message: '',
    type: 'post' as 'post' | 'comment',
    idToDelete: ''
  };
  isDeleting = false;

  // Estado para el modal de detalles de post (Estilo Instagram)
  showPostDetailModal = false;
  selectedPost: Post | null = null;
  selectedPostComments: Comment[] = [];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private universidadService: UniversidadService,
    private postService: PostService,
    private commentService: CommentService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['user', Validators.required],
      universidad: ['', Validators.required],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.loadUniversidades();
    if (this.userId) {
      this.loadUser();
      this.loadUserPosts();
      this.loadUserComments();
    }

    this.universidadSearch.valueChanges.subscribe(value => {
      this.filterUniversidades(value || '');
    });
  }

  setActiveTab(tab: 'profile' | 'posts' | 'comments'): void {
    this.activeTab = tab;
  }

  loadUserComments(): void {
    if (!this.userId) return;
    this.commentService.getComments().subscribe({
      next: (allComments: Comment[]) => {
        this.userComments = allComments.filter(c => {
          const authorId = typeof c.usuario === 'string' ? c.usuario : c.usuario._id;
          return authorId === this.userId;
        });
      },
      error: (err: any) => console.error('Error loading user comments:', err)
    });
  }

  loadUserPosts(): void {
    if (!this.userId) return;
    this.postService.getPostsFromUser(this.userId).subscribe({
      next: (posts: Post[]) => {
        this.userPosts = posts;
      },
      error: (err: any) => console.error('Error loading user posts:', err)
    });
  }

  // --- Lógica Unificada de Modals ---
  openConfirmModal(id: string, type: 'post' | 'comment'): void {
    this.confirmModalConfig = {
      type,
      idToDelete: id,
      title: type === 'post' ? '¿Eliminar publicación?' : '¿Eliminar comentario?',
      message: type === 'post' 
        ? 'Estás a punto de borrar este contenido permanentemente. Esta acción no se puede deshacer.' 
        : 'El comentario será eliminado de forma permanente. Esta acción no se puede deshacer.'
    };
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.isDeleting = false;
  }

  confirmAction(): void {
    const { type, idToDelete } = this.confirmModalConfig;
    if (!idToDelete) return;

    this.isDeleting = true;
    if (type === 'post') {
      this.postService.deletePost(idToDelete).subscribe({
        next: () => {
          this.userPosts = this.userPosts.filter(p => p._id !== idToDelete);
          this.closeConfirmModal();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error deleting post:', err);
          this.closeConfirmModal();
        }
      });
    } else {
      this.commentService.deleteComment(idToDelete).subscribe({
        next: () => {
          if (this.selectedPostComments) {
            this.selectedPostComments = this.selectedPostComments.filter(c => c._id !== idToDelete);
          }
          this.userComments = this.userComments.filter(c => c._id !== idToDelete);
          this.closeConfirmModal();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error deleting comment:', err);
          this.closeConfirmModal();
        }
      });
    }
  }

  // --- MODAL DETALLE POST ---
  openPostDetailModal(post: Post): void {
    this.selectedPost = post;
    this.showPostDetailModal = true;
    this.loadCommentsForPost(post._id);
  }

  closePostDetailModal(): void {
    this.showPostDetailModal = false;
    this.selectedPost = null;
    this.selectedPostComments = [];
  }

  loadCommentsForPost(postId: string): void {
    this.commentService.getCommentsFromPost(postId).subscribe({
      next: (comments: Comment[]) => {
        this.selectedPostComments = comments;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error loading post comments:', err)
    });
  }

  openPostFromComment(comment: Comment): void {
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

  selectUniversidad(uni: Universidad): void {
    this.userForm.patchValue({ universidad: uni._id });
    this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
    this.showUniversidadesDropdown = false;
  }

  getUniversidadNombre(id: string): string {
    const uni = this.universidades.find(u => u._id === id);
    return uni ? uni.nombre : '';
  }

  loadUniversidades(): void {
    this.universidadService.getUniversidades().subscribe({
      next: (data: Universidad[]) => {
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
          password: ''
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
        password: ''
      });

      if (uniId) {
        const uni = this.universidades.find(u => u._id === uniId);
        if (uni) this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
      }
    }
  }

  saveChanges(): void {
    if (this.userForm.valid && this.userId) {
      const dataToUpdate = { ...this.userForm.value };
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
        error: (err: any) => console.error('Error updating user:', err)
      });
    }
  }
}
