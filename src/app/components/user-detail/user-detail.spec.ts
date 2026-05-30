import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDetail } from './user-detail';
import { provideRouter } from '@angular/router'; // <-- 1. Importamos el proveedor de rutas

describe('UserDetail', () => {
  let component: UserDetail;
  let fixture: ComponentFixture<UserDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetail],
      providers: [provideRouter([])], // <-- 2. Añadimos el proveedor para simular el entorno de rutas
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetail);
    component = fixture.componentInstance;

    fixture.detectChanges(); // <-- 3. Activamos la detección de cambios inicial
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
