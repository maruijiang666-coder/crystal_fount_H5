# Tarot Card Optimization Plan

I will optimize the Tarot card selection and display logic in `src/pages/TaLuo/index.jsx` to support multiple spreads (牌阵) and dynamic card drawing.

## 1. Data & State Preparation

* **Import Data**: Import `tarot_mapping.json` to get card details and the OSS base URL.

* **Define Spreads**: Create a constant `SPREAD_TYPES` containing the 3 definitions:

  * **Decision Spread (三选一牌阵)**: Options 1/2/3.

  * **Holy Triangle Spread (圣三角牌阵)**: Past/Present/Future.

  * **Issue Focus Spread (三牌问题导向阵)**: Situation/Challenge/Advice.

* **New State**:

  * `currentSpreadIndex`: Tracks the currently selected spread (0-2).

  * `drawnCards`: Array storing the 3 selected Tarot card objects.

## 2. UI Implementation

* **Spread Selector (Swiper)**:

  * Add a `Swiper` component at the top of the page.

  * Display the Title, Description, and Core Features for each of the 3 spreads.

  * Allow users to swipe left/right to choose a spread ("page flipping effect").

* **Dynamic Result Display**:

  * Replace the hardcoded text area ("The first card", etc.) with dynamic content based on `currentSpreadIndex` and `drawnCards`.

  * Show the correct **Position Name** (e.g., "Past" or "Option 1") and **Card Name** (Chinese name).

## 3. Logic Implementation

* **Card Drawing Logic**:

  * Update `handleTouchEnd` (drag handling):

    * When a card is dragged up successfully:

    * Randomly select a unique Tarot card from the JSON data (filtering out the base URL and Card Back).

    * Ensure no duplicates are selected.

    * Push the selected card object to `drawnCards`.

* **Image Rendering**:

  * Construct the image URL using the base URL from the JSON + the `filename` of the drawn card.

  * Update the `floatingCardsContainer` to show the actual drawn card image instead of the placeholder.

## 4. Verification

* Verify that 3 unique cards can be drawn.

* Verify that swiping the spread selector updates the context (labels).

* Verify images load correctly from OSS.

