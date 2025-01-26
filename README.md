# webpage-monitor
Simple node app to email user for changes on webpages

Use your own .env file to insert details such as email credentials and page to be visited with the following variables: 

```
MAIL_SERVICE="Gmail"
MAIL_USER=""
MAIL_PASS=""
MAIL_TO=""
PRODUCT_SELECTOR="div#onlineinfo"
CHECK_INTERVAL="30000"
SITE_URL=""
AVAILABILITY_CHECK_TEXT="Sold out online"
INITIAL_MSG="Starting monitoring page for changes..."
CHANGE_DETECTED_MSG="Change detected, checking if relevant to availability..."
NO_CHANGE_MSG="Product is still marked 'Sold out online'. No notification."
```
