import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculoEmpresaComponent } from './vehiculo-empresa.component';

describe('VehiculoEmpresaComponent', () => {
  let component: VehiculoEmpresaComponent;
  let fixture: ComponentFixture<VehiculoEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculoEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculoEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
