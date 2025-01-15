import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";

import esri = __esri; // Esri TypeScript Types

import Config from '@arcgis/core/config';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';


import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
// import Polyline from '@arcgis/core/geometry/Polyline';
// import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
// import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
// import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import * as route from "@arcgis/core/rest/route.js";
import * as locator from "@arcgis/core/rest/locator";
// import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
// import { environment } from '../../../environments/environment';

import { MapService } from '../../services/map.service';
// import { Subscription } from 'rxjs';


@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();
  
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  map: esri.Map;
  view: esri.MapView;
  graphicsLayer: esri.GraphicsLayer;
  graphicsLayerUserPoints: esri.GraphicsLayer;
  graphicsLayerRoutes: esri.GraphicsLayer;
  shopsLayer: esri.FeatureLayer;

  zoom = 16;
  center: Array<number> = [44.73682450024377, 26.07817583063242];
  basemap = "streets-vector";
  loaded = false;
  directionsElement: any;
  public graphicsLayerFilterPoints: esri.GraphicsLayer;

  constructor(private db: AngularFireDatabase, private afAuth: AngularFireAuth, private mapService: MapService) { }

  ngOnInit() {
    this.initializeMap().then(() => {
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);
  
      // Initialize the search bar
      this.setupSearchBar();
    });
  
    this.updateUserPosition();
    this.mapService.setMapView(this.view);
    console.log("Map view set in map service {}", this.view);
    
  }

  async initializeMap() {
    try {
      Config.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurDL42Gp3pI8F-jYOI4SS4v1uYO0ON7J9aXaXe-GdxfhRU4_S6bl42unpFpfai6S1owL-szEKDz0Oeb2M7803Y3WKVLJnkRlhJWR6v-ZacsDp2eO5c0jB3JY5r6Rzto410sPGcalC2u2nDQbp8_gdnrNYV6Va8lXyfZQ9C6f8xnBIa9MxDmIaOmYy65CYRMtPt9l1R1M5R1xn7iYRQmyRheg.AT1_vh5PpVUz";
  
      const mapProperties: esri.WebMapProperties = {
        basemap: this.basemap
      };
      this.map = new WebMap(mapProperties);
  
      this.addFeatureLayers();
      this.addGraphicsLayer();
  
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };
      this.view = new MapView(mapViewProperties);
  
      await this.view.when();
      console.log("ArcGIS map loaded");
  
      // Watch for changes in the view's extent and zoom level
      this.view.watch("extent", () => this.queryFeaturesInExtent());
      this.view.watch("zoom", () => this.queryFeaturesInExtent());
  
      return this.view;
    } catch (error) {
      console.error("Error loading the map: ", error);
      alert("Error loading the map");
    }
  }
  queryFeaturesInExtent() {
    const extent = this.view.extent;
    const zoom = this.view.zoom;
  
    const desiredZoomLevel = 12;
    const maxFeaturesToDisplay = zoom <= desiredZoomLevel ? 100 : 500;
  
    if (zoom <= desiredZoomLevel) {
      const query = this.shopsLayer.createQuery();
      query.geometry = extent;
      query.spatialRelationship = "intersects";
      query.returnGeometry = true;
      query.outFields = ["*"];
      query.num = maxFeaturesToDisplay;
  
      this.graphicsLayerUserPoints.removeAll(); // Clear existing markers
  
      this.shopsLayer.queryFeatures(query).then((result) => {
        result.features.forEach((feature) => {
          const marker = new Graphic({
            geometry: feature.geometry,
            attributes: feature.attributes,
            symbol: new SimpleMarkerSymbol({
              color: [255, 0, 0], // Red
              outline: { color: [255, 255, 255], width: 1 },
            }),
          });
          this.graphicsLayerUserPoints.add(marker);
        });
      }).catch((error) => {
        console.error("Error querying features: ", error);
      });
    } else {
      this.graphicsLayerUserPoints.removeAll(); // Clear markers at higher zoom levels
    }
  }
  addFeatureLayers() {
    this.shopsLayer = new FeatureLayer({
      url: "https://services-eu1.arcgis.com/zci5bUiJ8olAal7N/arcgis/rest/services/OSM_EU_Shops/FeatureServer/0",
      outFields: ['*'],
      popupTemplate: {
        title: "{name}",
        content: [
          {
            type: "text",
            text: `
              <b>Shop Type:</b> {shop}<br>
              <b>Location:</b> {addr_street}<br>
              <b>Schedule:</b> {opening_hours}<br>
            `
          },
          {
            type: "custom",
            creator: () => {
              const button = document.createElement("button");
              button.innerText = "Get Directions";
              button.onclick = () => {
                const feature = this.view.popup.selectedFeature;
                if (feature?.geometry) {
                  const point = feature.geometry as __esri.Point;
                  console.log("Point coordinates: ", point.latitude, point.longitude);
                  navigator.geolocation.getCurrentPosition((position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    this.addRouting(userLat, userLng, point.latitude, point.longitude);
                  });
                }
              };
              return button;
            }
          },
          {
            type: "custom",
            creator: () => {
              const button = document.createElement("button");
              button.innerText = "Bookmark";
              button.onclick = () => {
                const feature = this.view.popup.selectedFeature;
                if (feature) {
                  this.addBookmark(feature);
                }
              };
              return button;
            }
          }
        ]
      }
    });
    this.map.add(this.shopsLayer);
  }

  // Find places and add them to the map
  findPlaces(category: string, pt: esri.Point) {
    const locatorUrl = "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    const simpleMarkerSymbol: esri.SimpleMarkerSymbolProperties = {
      type: "simple-marker",
      color: [255, 0, 0],  // Red
      outline: {
      color: [255, 255, 255], // White
      width: 1
      }
    };
    locator
      .addressToLocations(locatorUrl, {
        location: pt,
        categories: [category],
        maxLocations: 25,
        outFields: ["Place_addr", "PlaceName"],
        address: undefined
      })
      .then((results) => {
        this.view.closePopup();
        this.view.graphics.removeAll();

        const resultSymbol: esri.PictureMarkerSymbolProperties = {
          type: "picture-marker",
          url: "assets/icons/books.png", // Path to your image
          width: "24px",
          height: "24px"
        };
        // Add graphics for each result
        results.forEach((result) => {
          this.view.graphics.add(
            new Graphic({
              attributes: result.attributes, // Data attributes returned
              geometry: result.location, // Point returned
              symbol: resultSymbol,
              popupTemplate: {
          title: "{PlaceName}", // Data attribute names
          content: "{Place_addr}"
              }
            })
          );
        });
      });
  }

  focusBookmark(bookmark: any): void {
    const geometry = bookmark.geometry; // Geometria salvată în Firebase
    const point = new Point(geometry);
  
    this.view.goTo({
      target: point,
      zoom: 15,
    });
  }

  
  setupSearchBar() {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", "Search for places (e.g., Bakery)");
    input.setAttribute("class", "esri-widget esri-input");
    input.setAttribute("style", "width: 300px; padding: 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;");

    const resultsDiv = document.createElement("div");
    resultsDiv.setAttribute("class", "esri-widget esri-results");
    resultsDiv.setAttribute("style", "max-height: 150px; overflow-y: auto; background: white; width: 300px; border: 1px solid #ccc;");

    this.view.ui.add(input, "top-right");
    this.view.ui.add(resultsDiv, "top-right");

    input.addEventListener("input", (event) => {
        const query = (event.target as HTMLInputElement).value.trim().toLowerCase();

        if (query.length > 2) {
            this.shopsLayer.queryFeatures({
                where: `LOWER(shop) LIKE '%${query}%'`,
                outFields: ["shop"],
                returnDistinctValues: true
            }).then((result) => {
                resultsDiv.innerHTML = ""; // Clear previous results

                if (result.features.length === 0) {
                    resultsDiv.innerHTML = "<div style='padding: 5px;'>No results found</div>";
                } else {
                    result.features.forEach((feature) => {
                        const type = feature.attributes.shop;

                        const resultItem = document.createElement("div");
                        resultItem.setAttribute("style", "padding: 5px; cursor: pointer;");
                        resultItem.textContent = type;

                        resultItem.addEventListener("click", () => {
                            input.value = type;
                            resultsDiv.innerHTML = ""; // Clear results on selection
                            this.filterMapByCategory(type); // Apply filter to the map
                        });

                        resultsDiv.appendChild(resultItem);
                    });
                }
            });
        } else {
            resultsDiv.innerHTML = ""; // Clear results if query is too short
        }
    });
  }
  
  filterMapByCategory(query: string) {
    this.graphicsLayerFilterPoints.removeAll();
    if (!query) {
      return;
    }
    this.shopsLayer.definitionExpression = `shop = '${query}'`;
  }
  
  addPointToMap(lat: number, lng: number, attributes?: any): void {
    const point = new Point({
      longitude: lng,
      latitude: lat,
    });
  
    const pointGraphic = new Graphic({
      geometry: point,
      symbol: new SimpleMarkerSymbol({
        color: [255, 0, 0], // Red color
        size: 8,
        outline: {
          color: [255, 255, 255],
          width: 2,
        },
      }),
      attributes: attributes || {},
      popupTemplate: {
        title: "{name}",
        content: `
          <b>Type:</b> {type}<br>
          <b>Latitude:</b> ${lat}<br>
          <b>Longitude:</b> ${lng}
        `,
      },
    });
  
    this.graphicsLayerUserPoints.add(pointGraphic);
  }

  updateUserPosition(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
  
        this.view.center = new Point({ longitude: userLng, latitude: userLat });
        this.saveUserPositionToFirebase(userLat, userLng);
      }, (error) => {
        console.error('Geolocation error: ', error);
      }, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      });
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }
  saveUserPositionToFirebase(lat: number, lng: number): void {
    const userPositionRef = this.db.object('user_position');
    userPositionRef.set({ latitude: lat, longitude: lng });
  }

  addGraphicsLayer() {
    this.graphicsLayer = new GraphicsLayer();
    this.map.add(this.graphicsLayer);
    this.graphicsLayerUserPoints = new GraphicsLayer();
    this.map.add(this.graphicsLayerUserPoints);
    this.graphicsLayerFilterPoints = new GraphicsLayer();
    this.map.add(this.graphicsLayerFilterPoints);
    this.graphicsLayerRoutes = new GraphicsLayer();
    this.map.add(this.graphicsLayerRoutes);
  }

  addRouting(startLat: number, startLng: number, endLat: number, endLng: number) {
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    this.removePoints();
    this.removeRoutes();
    this.clearRouter();
    this.addPoint(startLat, startLng);
    this.addPoint(endLat, endLng);
    console.log("Routing from: ", startLat, startLng, " to: ", endLat, endLng);
    this.calculateRoute(routeUrl);
    
  }



  addPoint(lat: number, lng: number) {
    let point = new Point({
      longitude: lng,
      latitude: lat
    });

    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };

    let pointGraphic: esri.Graphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.graphicsLayerUserPoints.add(pointGraphic);
  }

  removePoints() {
    this.graphicsLayerUserPoints.removeAll();
  }
  removeRoutes() {
    this.graphicsLayerRoutes.removeAll();
  }


  

  async calculateRoute(routeUrl: string) {
    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: this.graphicsLayerUserPoints.graphics.toArray()
      }),
      returnDirections: true
    });

    try {
      const data = await route.solve(routeUrl, routeParams);
      this.displayRoute(data);
    } catch (error) {
      console.error("Error calculating route: ", error);
      alert("Error calculating route");
    }
  }

  displayRoute(data: any) {
    for (const result of data.routeResults) {
      result.route.symbol = {
        type: "simple-line",
        color: [5, 150, 255],
        width: 3
      };
      this.graphicsLayerRoutes.graphics.add(result.route);
    }
    if (data.routeResults.length > 0) {
      this.showDirections(data.routeResults[0].directions.features);
    } else {
      alert("No directions found");
    }
  }
  showDirections(features: any[]) {
    this.directionsElement = document.createElement("ol");
    this.directionsElement.classList.add("esri-widget", "esri-widget--panel", "esri-directions__scroller");
    this.directionsElement.style.marginTop = "0";
    this.directionsElement.style.marginBottom = "0";

    features.forEach(feature => {
      const li = document.createElement("li");
      li.textContent = feature.attributes.text;
      this.directionsElement.appendChild(li);
    });

    this.view.ui.add(this.directionsElement, "top-right");
  }
  clearRouter() {
    if (this.view) {
      // Remove all graphics related to routes
      this.removeRoutes();
      this.removePoints();
      console.log("Route cleared");
      this.view.ui.remove(this.directionsElement);
      this.view.ui.empty("top-right");
      console.log("Directions cleared");
    }
  }
  
  ngOnDestroy() {
    if (this.view) {
      this.view.container = null;
    }
  }
  addBookmark(feature: __esri.Graphic): void {
    // Obține ID-ul utilizatorului autentificat
    this.afAuth.currentUser.then((user) => {
      if (user && user.uid) {
        const userId = user.uid;
        console.log('User authenticated:', user.uid);  // Verifică dacă user-ul este autentificat
        // Adaugă bookmark-ul în baza de date Firebase
        if (feature.geometry && feature.geometry.type === 'point') {
          const point = feature.geometry as __esri.Point; // Cast la tipul corect
        this.db.list(`bookmarks/${userId}`).push({
          name: feature.attributes?.name ?? 'No name', // Numele locului
          shop: feature.attributes?.shop ?? 'Unknown', // Magazinul sau locația
          latitude: point.latitude,         // Latitudinea
          longitude: point.longitude,       // Longitudinea , le iau pentru afisarea pe harta
        });
        console.log('Bookmark added:', feature.attributes?.name);
        console.log('bookmarks: ', this.db.list(`bookmarks/${userId}`));

        // Notifică utilizatorul că bookmark-ul a fost adăugat
        alert('Bookmark added!');
      } else {
        alert('You must be logged in to add bookmarks.');
      }
    }
    }).catch((error) => {
      console.error('Error fetching user:', error);
      alert('An error occurred while adding the bookmark.');
    });
  }

  zoomToLocation(latitude: number, longitude: number): void {
    console.log(`Zooming to location: ${latitude}, ${longitude}`);
    if (this.view) {
      const point = new Point({
        latitude: latitude,
        longitude: longitude
      });
      this.view.goTo({
        target: point,
        zoom: 15
      }).then(() => {
        console.log(`Map zoomed to: ${latitude}, ${longitude}`);
      }).catch((error) => {
        console.error('Error zooming to location:', error);
      });
    } else {
      console.error('MapView is not initialized.');
    }
  }
  

}
