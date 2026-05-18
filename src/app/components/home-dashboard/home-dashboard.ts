import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsService } from '../../services/stats-service';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './home-dashboard.html',
  styleUrl: './home-dashboard.css'
})
export class HomeDashboard implements OnInit {
  // Usamos SIGNALS para una reactividad perfecta
  userCount = signal<number | null>(null);
  universityCount = signal<number | null>(null);
  postCount = signal<number | null>(null);
  commentCount = signal<number | null>(null);
  reportCount = signal<number | null>(null);

  apiStatus = signal<'online' | 'offline' | 'checking'>('checking');
  dbStatus = signal<'online' | 'offline' | 'checking'>('checking');
  webClientStatus = signal<'online' | 'offline' | 'checking'>('checking');
  webClientUrl = 'https://ea5.upc.edu/login';

  private platformId = inject(PLATFORM_ID);
  private statsService = inject(StatsService);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllStats();
      this.checkWebClientStatus();
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

    this.checkWebClientStatus();
  }

  checkWebClientStatus(): void {
    this.webClientStatus.set('checking');
    // Intentamos cargar el index de la web cliente (ajusta la URL según necesites)
    // Usamos mode: 'no-cors' para evitar problemas de CORS en un ping básico
    fetch(this.webClientUrl, { mode: 'no-cors' })
      .then(() => this.webClientStatus.set('online'))
      .catch(() => this.webClientStatus.set('offline'));
  }
}
