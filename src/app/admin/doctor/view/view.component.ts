import {ChangeDetectionStrategy, Component, computed, OnInit, signal, WritableSignal} from '@angular/core';
import {DoctorService} from '../../services/doctor.service';
import {DoctorType} from "../../../../types/doctor.type";
import {DoctorProfileCardComponent} from "../../../shared/doctor-profile-card/doctor-profile-card.component";

@Component({
  selector: 'doctor-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DoctorProfileCardComponent
  ]
})
export class ViewComponent implements OnInit {
  DoctorDetails: WritableSignal<DoctorType[]> = signal([]);
  loading = signal(false);
  loadError = signal('');
  searchTerm = signal('');
  visibleDoctors = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.DoctorDetails();

    return this.DoctorDetails().filter(doctor =>
      [doctor.fName, doctor.lName, doctor.speciality, doctor.city, doctor.state, doctor.emailId, doctor.docId]
        .some(value => value.toLowerCase().includes(query))
    );
  });

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {
    void this.loadAllDoctors();
  }

  async loadAllDoctors(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.loadError.set('');
    try {
      this.DoctorDetails.set(await this.doctorService.getAllDoctors());
    } catch (error) {
      this.loadError.set(String(error));
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
}
