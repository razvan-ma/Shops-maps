import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private mapView: __esri.MapView | null = null;
  private pendingLocation: { latitude: number; longitude: number } | null = null;


  setMapView(view: __esri.MapView): void {
    this.mapView = view;
    if (this.pendingLocation) {
      console.log('Setting pending location:', this.pendingLocation);
      this.zoomToLocation(this.pendingLocation.latitude, this.pendingLocation.longitude);
      this.pendingLocation = null;
    }
  }

  zoomToLocation(latitude: number, longitude: number): void {
    if (this.mapView) {
      console.log(`Zooming to location: ${latitude}, ${longitude}`);
      this.mapView.goTo({
        center: [longitude, latitude],
        zoom: 45,
      }).catch((error) => console.error('Error zooming to location:', error));
    } else {
      this.pendingLocation = { latitude, longitude };
    }
  }
}
