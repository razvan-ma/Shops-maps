# Shops map
A website that diplays shops near you, using **Angular**. Users can make an account and store bookmark data, and also get routing information in order to reach the destination from their current location.
_________________
### Core functionalities

The map uses **ArcGis API** in order to:
- determine the current position of the user
- display nearby shops via a Feature Layer
- display travel routes from the current position to the selected location

Additionally, user data is stored into **Firebase** for convenience. A logged in user can bookmark locations and then access them from a special tab.
___________________
The site can be viewed on localhost using ``npm run start`` in the user terminal.
