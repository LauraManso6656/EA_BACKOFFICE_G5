import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { BugService } from '../../services/bug-service';
import { BugReport } from '../../models/bug';

@Component({
  selector: 'app-bug-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './bug-detail.html',
  styleUrl: './bug-detail.css'
})
export class BugDetail implements OnInit {
  bug: BugReport | null = null;
  loading = true;

  private route = inject(ActivatedRoute);
  private bugService = inject(BugService);
  private location = inject(Location);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadBug(id);
      }
    }
  }

  loadBug(id: string): void {
    this.bugService.getBug(id).subscribe({
      next: (res) => {
        this.bug = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bug:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(newStatus: string): void {
    if (!this.bug) return;
    this.bugService.updateBugStatus(this.bug._id, newStatus).subscribe({
      next: (updated) => {
        if (this.bug && typeof this.bug.usuarioReporta !== 'string') {
           updated.usuarioReporta = this.bug.usuarioReporta;
        }
        this.bug = updated;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error updating status:', err)
    });
  }

  goBack(): void {
    this.location.back();
  }

  getAuthorName(): string {
    if (!this.bug || !this.bug.usuarioReporta) return 'System';
    if (typeof this.bug.usuarioReporta === 'string') return 'Anonymous';
    return this.bug.usuarioReporta.nombre || 'Unknown';
  }

  getInitials(): string {
    return this.getAuthorName().substring(0, 2).toUpperCase();
  }
}
