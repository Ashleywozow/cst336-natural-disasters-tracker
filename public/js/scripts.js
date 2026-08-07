
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