// const disasterSelect = document.querySelector("#disaster_type");
// const otherContainer = document.querySelector(
//   "#other_disaster_container"
// );
// const otherInput = document.querySelector("#other_disaster_type");

// if (disasterSelect) {
//   disasterSelect.addEventListener("change", function () {
//     const selectedOther = disasterSelect.value === "Other";

//     otherContainer.hidden = !selectedOther;
//     otherInput.required = selectedOther;

//     if (!selectedOther) {
//       otherInput.value = "";
//     }
//   });
// } ----> for the "Other" option in the disaster type dropdown, but this will be added later with other js code.

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