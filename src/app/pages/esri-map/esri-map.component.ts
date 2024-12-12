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
import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import * as route from "@arcgis/core/rest/route.js";
import * as locator from "@arcgis/core/rest/locator";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

import { AngularFireDatabase } from '@angular/fire/compat/database';
import { environment } from '../../../environments/environment';

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

  zoom = 10;
  center: Array<number> = [44.73682450024377, 34.07817583063242];
  basemap = "streets-vector";
  loaded = false;
  directionsElement: any;

  constructor(private db: AngularFireDatabase) { }

  ngOnInit() {
    this.initializeMap().then(() => {
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);
    });
    this.task3();
    this.updateUserPosition(); 
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
      return this.view;
    } catch (error) {
      console.error("Error loading the map: ", error);
      alert("Error loading the map");
    }
  }

  addFeatureLayers() {
    this.shopsLayer = new FeatureLayer({
      url: "https://services-eu1.arcgis.com/zci5bUiJ8olAal7N/arcgis/rest/services/OSM_EU_Shops/FeatureServer/0",
      outFields: ['*']
    });
  
    this.map.add(this.shopsLayer);
  }

  // Find places and add them to the map
  findPlaces(category, pt) {
    const locatorUrl = "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    const simpleMarkerSymbol = {
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

  task3() {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", "Search for shop type...");
    input.setAttribute("class", "esri-widget esri-input");
    input.setAttribute("style", "width: 175px; font-family: 'Avenir Next W00'; font-size: 1em");
  
    const resultsDiv = document.createElement("div");
    resultsDiv.setAttribute("class", "esri-widget esri-results");
    resultsDiv.setAttribute("style", "max-height: 150px; overflow-y: auto; background: white; width: 175px; border: 1px solid #ccc;");
  
    this.view.ui.add(input, "bottom-left");
    this.view.ui.add(resultsDiv, "bottom-left");
  
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
                this.filterShopsByType(type); // Apply filter to the map
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
  filterShopsByType(shopType: string): void {
    // Apply a definition query to the FeatureLayer
    this.shopsLayer.definitionExpression = `shop = '${shopType}'`;
    console.log(`Filtering shops by type: ${shopType}`);
  }
  resetShopFilter(): void {
    // Clear the definition query to show all shops
    this.shopsLayer.definitionExpression = null;
    console.log("Shop filter reset");
  }


  updateUserPosition(): void {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((position) => {
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
    this.graphicsLayerRoutes = new GraphicsLayer();
    this.map.add(this.graphicsLayerRoutes);
  }

  addRouting() {
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
  
    this.view.on("click", (event) => {
      this.view.hitTest(event).then((elem: esri.HitTestResult) => {
        if (elem && elem.results && elem.results.length > 0) {
          // Check if the clicked element is a shop or a point for routing
          let point: esri.Point = elem.results.find(e => e.layer === this.shopsLayer)?.mapPoint;
  
          if (point) {
            if (this.graphicsLayerUserPoints.graphics.length === 0) {
              // Add first point for routing
              this.addPoint(point.latitude, point.longitude);
            } else if (this.graphicsLayerUserPoints.graphics.length === 1) {
              // Add second point for routing and calculate the route
              this.addPoint(point.latitude, point.longitude);
              this.calculateRoute(routeUrl);
            } else {
              // If two points exist, clear them
              this.removePoints();
            }
          }
        }
      });
    });
  }
  addPointToMap(lat: number, lng: number, attributes?: any): void {
    const point = new Point({
      longitude: lng,
      latitude: lat
    });

    const pointGraphic = new Graphic({
      geometry: point,
      symbol: new SimpleMarkerSymbol({
        color: [255, 0, 0],  // Red color
        size: 8,
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      }),
      attributes: attributes || {},
      popupTemplate: { 
        title: "{shop}", 
        content: `
          <b>Shop Type:</b> {shop}<br>
          <b>Location:</b> {Place_addr}<br>
          <b>Latitude:</b> {latitude}<br>
          <b>Longitude:</b> {longitude}
        `
      }
    });

    this.view.graphics.add(pointGraphic);
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
}
