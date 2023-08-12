/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DebugElement } from "@angular/core";
import { ManagerWeeklyCalendarComponent } from "./manager-weekly-calendar.component";

describe("ManagerWeeklyCalendarComponent", () => {
    let component: ManagerWeeklyCalendarComponent;
    let fixture: ComponentFixture<ManagerWeeklyCalendarComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ManagerWeeklyCalendarComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ManagerWeeklyCalendarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
