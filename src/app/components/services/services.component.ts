import { Component } from '@angular/core';

interface DentalService {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent {

  services: DentalService[] = [
    {
      icon: '🦷',
      title: 'General Dentistry',
      description: 'Regular check-ups, fillings and everyday dental care.'
    },
    {
      icon: '✦',
      title: 'Cosmetic Dentistry',
      description: 'Professional treatments designed to improve your smile.'
    },
    {
      icon: '✓',
      title: 'Preventive Care',
      description: 'Helping protect your teeth and gums for the future.'
    },
    {
      icon: '+',
      title: 'Emergency Care',
      description: 'Prompt dental care when unexpected problems happen.'
    }
  ];

}