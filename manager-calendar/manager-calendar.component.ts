import { Component, EventEmitter, Output } from "@angular/core";
import { CalendarComponent } from "reservation/calendar/calendar.component";
import { HolidayService } from "reservation/service/holiday.service";
import { ReservationService } from "reservation/service/reservation.service";

@Component({
    selector: "manager-calendar",
    templateUrl: "./manager-calendar.component.html",
    styleUrls: ["./manager-calendar.component.scss"],
})
export class ManagerCalendarComponent extends CalendarComponent {
    @Output() moveTable = new EventEmitter<void>();

    constructor(private holydayService: HolidayService, private reservationService: ReservationService) {
        super(holydayService);
    }

    details(date: any) {
        this.reservationService.setReservationForm(
            {
                날짜: `${this.currentYear}-${this.currentMonth}-${date.date}`,
            },
            true
        );
        this.moveTable.emit();
    }
}
