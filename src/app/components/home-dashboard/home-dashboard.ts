import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsService } from '../../services/stats-service';
import { EventoService } from '../../services/evento-service';
import { Navbar } from '../navbar/navbar';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './home-dashboard.html',
  styleUrl: './home-dashboard.css'
})
export class HomeDashboard implements OnInit {
  public environment = environment;
  
  userCount = signal<number | null>(null);
  universityCount = signal<number | null>(null);
  postCount = signal<number | null>(null);
  commentCount = signal<number | null>(null);
  reportCount = signal<number | null>(null);
  eventCount = signal<number | null>(null);

  apiStatus = signal<'online' | 'offline' | 'checking'>('checking');
  dbStatus = signal<'online' | 'offline' | 'checking'>('checking');
  webClientStatus = signal<'online' | 'offline' | 'checking'>('checking');
  webClientUrl = 'https://ea5.upc.edu/login';
  matomoStatus = signal<'online' | 'offline' | 'checking'>('checking');
  matomoUrl = 'https://ea5-ws.upc.edu/';

  private platformId = inject(PLATFORM_ID);
  private statsService = inject(StatsService);
  private eventoService = inject(EventoService);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllStats();
    }
  }

  loadAllStats(): void {
    this.apiStatus.set('checking');
    this.dbStatus.set('checking');

    this.statsService.getGlobalStats().subscribe({
      next: (data) => {
        this.userCount.set(data.users);
        this.universityCount.set(data.universities);
        this.postCount.set(data.posts);
        this.commentCount.set(data.comments);
        this.reportCount.set(data.reports);

        // El servidor ha contestado, así que el API Server está online
        this.apiStatus.set('online');
        // El servidor nos dice explícitamente el estado de la DB
        this.dbStatus.set(data.dbStatus || 'online');
      },
      error: (err) => {
        console.error('Error fetching global stats:', err);
        this.apiStatus.set('offline'); // El servidor no ha contestado
        this.dbStatus.set('offline');  // Si el servidor no contesta, asumimos DB offline también
      }
    });

    // Cargar estadísticas de eventos desde el EventoService
    this.eventoService.getEventos().subscribe({
      next: (eventos) => {
        this.eventCount.set(eventos ? eventos.length : 0);
      },
      error: (err) => {
        console.error('Error loading events for dashboard stats:', err);
        this.eventCount.set(0);
      }
    });

    this.checkWebClientStatus();
    this.checkMatomoStatus();
  }

  checkWebClientStatus(): void {
    this.webClientStatus.set('checking');
    fetch(this.webClientUrl, { mode: 'no-cors' })
      .then(() => this.webClientStatus.set('online'))
      .catch(() => this.webClientStatus.set('offline'));
  }

  checkMatomoStatus(): void {
    this.matomoStatus.set('checking');
    fetch(this.matomoUrl, { mode: 'no-cors' })
      .then(() => this.matomoStatus.set('online'))
      .catch(() => this.matomoStatus.set('offline'));
  }
}
