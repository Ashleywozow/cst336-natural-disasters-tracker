// CR

// Community reports javascript
// This is for the option "Other" so a text box can appear for the user to enter a disaster type
const disasterSelect = document.querySelector("#disaster_type");
const otherContainer = document.querySelector(
  "#other_disaster_container"
);
const otherInput = document.querySelector("#other_disaster_type");

if (disasterSelect) {
  disasterSelect.addEventListener("change", function () {
    const selectedOther = disasterSelect.value === "Other";

    otherContainer.hidden = !selectedOther;
    otherInput.required = selectedOther;

    if (!selectedOther) {
      otherInput.value = "";
    }
  });
} 

// this is the modal logic for deleting a report
const deleteModal = document.querySelector("#deleteReportModal");
const openDeleteModal = document.querySelector("#openDeleteModal");
const closeDeleteModal = document.querySelector("#closeDeleteModal");

if (deleteModal && openDeleteModal && closeDeleteModal) {

  openDeleteModal.addEventListener("click", function () {
    deleteModal.hidden = false;
  });

  closeDeleteModal.addEventListener("click", function () {
    deleteModal.hidden = true;
  });

  deleteModal.addEventListener("click", function (event) {

    if (event.target === deleteModal) {
      deleteModal.hidden = true;
    }

  });
}

// Earthquakes 

// ----- Remembers the user's preferred minimum magnitude filter -----
const magnitudeSelect = document.querySelector("#minMagnitude");

if (magnitudeSelect) {
  const urlParams = new URLSearchParams(window.location.search);
  const storedMagnitude = localStorage.getItem("preferredMinMagnitude");

  // If they landed on this page with no filter in the URL but have a
  // saved preference, redirect once so the results reflect it.
  if (!urlParams.has("minMagnitude") && storedMagnitude) {
    window.location.href =
      "/earthquakes?minMagnitude=" + encodeURIComponent(storedMagnitude);
  }

  // Saves whatever they pick so it's remembered next time they visit.
  const magnitudeFilterForm = document.querySelector("#magnitudeFilterForm");

  if (magnitudeFilterForm) {
    magnitudeFilterForm.addEventListener("submit", function () {
      localStorage.setItem("preferredMinMagnitude", magnitudeSelect.value);
    });
  }
}

// ----- Confirms before removing a saved earthquake -----
const removeButtons = document.querySelectorAll(".removeSavedBtn");

for (let i = 0; i < removeButtons.length; i++) {
  removeButtons[i].addEventListener("click", function (event) {
    const confirmed = confirm("Remove this saved earthquake?");

    if (!confirmed) {
      event.preventDefault();
    }
  });
}

// Filters Natural Events cards by category.
const eventCategoryFilter = document.querySelector("#eventCategoryFilter");
const eventCards = document.querySelectorAll(".event-card");

if (eventCategoryFilter && eventCards.length > 0) {
  eventCategoryFilter.addEventListener("change", function () {
    const selectedCategory = eventCategoryFilter.value;

    for (let card of eventCards) {
      const cardCategory = card.dataset.category;

      if (
        selectedCategory === "all" ||
        cardCategory === selectedCategory
      ) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    }
  });
}