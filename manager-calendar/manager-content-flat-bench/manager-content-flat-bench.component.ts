import { Component } from "@angular/core";
import { ContentFlatBenchComponent } from "reservation/calendar/content-flat-bench/content-flat-bench.component";

@Component({
    selector: "manager-content-flat-bench",
    templateUrl: "./manager-content-flat-bench.component.html",
    styleUrls: ["../manager-calendar.component.scss"],
})
export class ManagerContentFlatBenchComponent extends ContentFlatBenchComponent {
    getText(value: string): string {
        return value.slice(0, 3);
    }
}
