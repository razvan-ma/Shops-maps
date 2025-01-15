import { Component } from "@angular/core";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    backgroundImageUrl: string = 'assets/background.png';

    constructor() {

    }
}