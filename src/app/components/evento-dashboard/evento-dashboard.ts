import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { Evento } from '../../models/evento';
import { EventoService } from '../../services/evento-service';
import { Navbar } from '../navbar/navbar';
import { ConfirmService } from '../../services/confirm-service';

@Component({
  selector: 'app-evento-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Navbar],
  templateUrl: './evento-dashboard.html',
  styleUrl: './evento-dashboard.css',
})
export class EventoDashboard implements OnInit {
  eventos: Evento[] = [];
  filteredEventos: Evento[] = [];
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  totalEventsCount = 0;
  totalAttendeesCount = 0;

  // Pagination (handled in frontend since backend /eventos isn't paginated)
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalDocs = 0;

  private platformId = inject(PLATFORM_ID);
  private confirmService = inject(ConfirmService);
  private eventoService = inject(EventoService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.load();

      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.currentPage = 1;
        this.applyFilterAndPagination();
      });
    }
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.eventoService.getEventos().subscribe({
      next: (res) => {
        this.eventos = res || [];
        
        // Calculate basic statistics
        this.totalEventsCount = this.eventos.length;
        this.totalAttendeesCount = this.eventos.reduce((acc, curr) => acc + (curr.asistentes?.length || 0), 0);
        
        this.applyFilterAndPagination();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Error loading events.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilterAndPagination(): void {
    const searchTerm = (this.searchControl.value || '').toLowerCase().trim();
    
    // 1. Search filter
    let results = this.eventos;
    if (searchTerm) {
      results = this.eventos.filter(ev => 
        (ev.titulo || '').toLowerCase().includes(searchTerm) ||
        (ev.descripcion || '').toLowerCase().includes(searchTerm) ||
        (ev.ubicacionNombre || '').toLowerCase().includes(searchTerm) ||
        (ev.creador?.nombre || '').toLowerCase().includes(searchTerm)
      );
    }

    this.totalDocs = results.length;
    this.totalPages = Math.ceil(this.totalDocs / this.pageSize) || 1;

    // 2. Pagination slice
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredEventos = results.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilterAndPagination();
    }
  }

  openDeleteModal(evento: Evento): void {
    this.confirmService.ask({
      title: 'Eliminar Evento?',
      message: `¿Estás seguro de que quieres eliminar el evento "${evento.titulo}"? Esta acción no se puede deshacer.`,
      type: 'warning',
      confirmText: 'Eliminar',
      onConfirm: () => {
        this.eventoService.deleteEvento(evento._id).subscribe({
          next: () => {
            this.load();
          },
          error: (err) => console.error('Error deleting event:', err)
        });
      }
    });
  }

  getCreatorName(evento: Evento): string {
    if (!evento || !evento.creador) return 'Usuario Eliminado';
    return typeof evento.creador === 'object' ? evento.creador.nombre : 'ID: ' + evento.creador;
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
