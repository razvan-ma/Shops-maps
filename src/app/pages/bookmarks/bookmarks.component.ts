import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { EsriMapComponent } from '../esri-map/esri-map.component';
import { MapService } from '../../services/map.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss'],
})
export class BookmarksComponent {
  bookmarks: any[] = []; // To hold the list of bookmarks
  newBookmark = { name: '', location: '' }; // For the add bookmark form
  userId: string | null = null;
  esriMapComponent: EsriMapComponent;

  constructor(private afAuth: AngularFireAuth, private db: AngularFireDatabase, private mapService: MapService, private router: Router) {
    this.loadBookmarks(); // Load bookmarks on initialization
    const userId = this.afAuth.currentUser?.then((user) => user.uid); 
  }

  ngOnInit(): void {
    this.afAuth.currentUser.then((user) => {
      if (user && user.uid) {
        this.userId = user.uid;
        console.log('User ID:', this.userId);
  
        // Încarcă bookmark-urile după ce userId este setat
        this.loadBookmarks();
      } else {
        console.error('No user is logged in. Cannot load bookmarks.');
      }
    });
  }
  

  async loadBookmarks() {
    if (this.userId) {
      this.db.list(`bookmarks/${this.userId}`).snapshotChanges().subscribe((snapshot) => {
        this.bookmarks = snapshot.map((item) => ({
            key: item.key, // Cheia unică a elementului
            ...item.payload.val() as any, // Valorile elementului
          }));
          console.log('Bookmarks with keys:', this.bookmarks);
        });
    }
    else {
      console.error('No user ID found.');
    }
  }

  async addBookmark() {
    if (this.newBookmark.name && this.newBookmark.location && this.userId) {
      const bookmarksRef = this.db.list(`users/${this.userId}/bookmarks`);

      // Add new bookmark to Firebase
      bookmarksRef.push(this.newBookmark).then(() => {
        this.newBookmark = { name: '', location: '' }; // Clear the form
      });
    }
    else {
      console.error('Bookmark name, location, or user ID not found.');
    }
  }

  goToLocation(latitude: number, longitude: number): void {
    this.router.navigate(['/map']).then(() => {
      console.log(`Navigating to location: ${latitude}, ${longitude}`);
      this.mapService.zoomToLocation(latitude, longitude);
    });
  }
  

  deleteBookmark(bookmarkKey: string): void {
    if (!this.userId) {
      console.error('No user ID found. Cannot delete bookmark.');
        return;
    }
    console.log(`Deleting bookmark with key ${bookmarkKey} from user ${this.userId}...`);
    this.db.list(`bookmarks/${this.userId}`).remove(bookmarkKey).then(() => {
      console.log(`Bookmark with key ${bookmarkKey} deleted successfully.`);
    }).catch((error) => {
      console.error('Error deleting bookmark:', error);
    });
    alert('Bookmark deleted successfully.');
    this.loadBookmarks();
  }
  
}
