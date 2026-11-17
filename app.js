const rooms = [
  { id: "lib-204", code: "LIB-204", name: "Willow Study Room", type: "Study", building: "Main Library", buildingKey: "Library", capacity: 4, amenities: ["Whiteboard", "Power outlets"], image: "library", distance: "2 min walk", available: "Available now", purpose: ["Quiet study", "Group project"], released: false },
  { id: "inn-112", code: "INN-112", name: "The Green Room", type: "Study", building: "Innovation Hall", buildingKey: "Innovation", capacity: 6, amenities: ["Projector", "Whiteboard", "Power outlets"], image: "innovation", distance: "5 min walk", available: "Available now", purpose: ["Group project", "Presentation"], released: false },
  { id: "art-308", code: "ART-308", name: "Studio Three", type: "Seminar", building: "Arts Building", buildingKey: "Arts", capacity: 8, amenities: ["Projector", "Video conferencing"], image: "arts", distance: "7 min walk", available: "Available now", purpose: ["Presentation", "Group project"], released: false },
  { id: "sci-226", code: "SCI-226", name: "Fern Collaboration Suite", type: "Study", building: "Science Centre", buildingKey: "Science", capacity: 10, amenities: ["Whiteboard", "Power outlets", "Video conferencing"], image: "science", distance: "9 min walk", available: "Available at 2:30 PM", availableAt: 14.5, purpose: ["Group project", "Quiet study"], released: false },
  { id: "lib-117", code: "LIB-117", name: "Oak Seminar Room", type: "Seminar", building: "Main Library", buildingKey: "Library", capacity: 12, amenities: ["Projector", "Whiteboard"], image: "seminar", distance: "3 min walk", available: "Available now", purpose: ["Presentation", "Group project"], released: true },
  { id: "inn-205", code: "INN-205", name: "Quiet Corner", type: "Study", building: "Innovation Hall", buildingKey: "Innovation", capacity: 2, amenities: ["Power outlets"], image: "study", distance: "6 min walk", available: "Available at 3:00 PM", availableAt: 15, purpose: ["Quiet study"], released: false }
];

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const shortDate = date => new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date);
const fullDate = date => new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(date);
const clockTime = value => {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, hours, minutes));
};

const bookings = [
  { id: "bk-1083", roomId: "lib-204", date: new Date(tomorrow), start: "10:00", end: "11:30", purpose: "Quiet study", status: "CONFIRMED" },
  { id: "bk-1084", roomId: "inn-112", date: new Date(tomorrow), start: "14:00", end: "15:00", purpose: "Group project", status: "CONFIRMED" }
];
let currentTab = "all";
let bookingFilter = "upcoming";
let currentView = "discover";
let selectedRoom = null;
let listLayout = false;

const $ = selector => document.querySelector(selector);
const roomGrid = $("#room-grid");
const roomTimes = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
const setSelectOptions = (select, values, selected) => {
  select.innerHTML = values.map(value => `<option value="${value}" ${value === selected ? "selected" : ""}>${clockTime(value)}</option>`).join("");
};
setSelectOptions($("#start-time"), roomTimes, "14:00");
setSelectOptions($("#end-time"), roomTimes.filter(time => time > "14:00"), "16:00");
$("#date-input").value = localDate(tomorrow);
$("#date-input").min = localDate(today);
$("#date-input").max = localDate(new Date(today.getTime() + 14 * 86400000));
$("#today-label").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(today);

function getRoom(id) { return rooms.find(room => room.id === id); }
function getTimeRange() { return `${clockTime($("#start-time").value)} – ${clockTime($("#end-time").value)}`; }
function hasActiveBooking(room) { return bookings.some(booking => booking.roomId === room.id && ["CONFIRMED", "CHECKED_IN"].includes(booking.status)); }
function filteredRooms() {
  const minCapacity = Number($("#capacity").value);
  const type = $("#room-type").value;
  const amenity = $("#amenity").value;
  const building = $("#building").value;
  const purpose = $("#purpose").value;
  let matches = rooms.filter(room => room.capacity >= minCapacity
    && (type === "all" || room.type === type)
    && (amenity === "all" || room.amenities.includes(amenity))
    && (building === "all" || room.buildingKey === building)
    && (purpose === "all" || room.purpose.includes(purpose)));
  if (currentTab === "soon") matches = matches.filter(room => !room.availableAt || room.availableAt <= 16);
  if (currentTab === "released") matches = matches.filter(room => room.released);
  const sort = $("#sort-select").value;
  if (sort === "capacity") matches.sort((a, b) => a.capacity - b.capacity);
  if (sort === "name") matches.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "recommended") matches.sort((a, b) => Number(a.availableAt || 0) - Number(b.availableAt || 0));
  return matches;
}

function renderRooms() {
  const found = filteredRooms();
  roomGrid.classList.toggle("list-layout", listLayout);
  $("#empty-state").classList.toggle("hidden", found.length > 0);
  roomGrid.classList.toggle("hidden", found.length === 0);
  $("#result-count").textContent = `${found.length} ${found.length === 1 ? "space" : "spaces"}`;
  $("#all-count").textContent = rooms.length;
  $("#showing-count").textContent = found.length;
  $("#results-title").firstChild.textContent = currentTab === "released" ? "Just released " : currentTab === "soon" ? "Available soon " : "Available rooms ";
  $("#results-caption").textContent = currentTab === "released" ? "Rooms that recently became available" : `Spaces available for ${getTimeRange()} tomorrow`;
  roomGrid.innerHTML = found.map(room => {
    const active = hasActiveBooking(room);
    const tags = room.amenities.slice(0, 2).map(item => `<span class="amenity-chip">${item}</span>`).join("");
    const availClass = room.availableAt ? "soon" : "";
    return `<article class="room-card">
      <div class="room-image image-${room.image}">
        <span class="availability-badge ${availClass}">${room.availableAt ? "Available soon" : "Available now"}</span>
        <span class="image-room-code">${room.code}</span>
      </div>
      <div class="room-body">
        <div class="room-meta">${room.type} room <span>·</span> ${room.code}</div>
        <div class="room-title-row"><h3>${room.name}</h3><span class="distance">↗ ${room.distance}</span></div>
        <div class="room-location">${room.building}</div>
        <div class="room-specs"><span><span class="spec-icon">♙</span>${room.capacity} people</span><span><span class="spec-icon">◷</span>${room.availableAt ? clockTime(room.availableAt + ":00") : "Open now"}</span></div>
        <div class="amenity-list">${tags}</div>
        <div class="room-card-footer"><span class="next-free">${room.available}</span><button class="book-button" data-book="${room.id}" ${active ? "disabled" : ""}>${active ? "Already booked" : "Book room"} <span>→</span></button></div>
      </div>
    </article>`;
  }).join("");
}

function renderBookings() {
  const visible = bookings.filter(booking => bookingFilter === "upcoming" ? ["CONFIRMED", "CHECKED_IN"].includes(booking.status) : ["CANCELLED", "NO_SHOW", "COMPLETED"].includes(booking.status))
    .sort((a, b) => a.date - b.date || a.start.localeCompare(b.start));
  $("#booking-count").textContent = bookings.filter(booking => ["CONFIRMED", "CHECKED_IN"].includes(booking.status)).length;
  $("#upcoming-count").textContent = bookings.filter(booking => ["CONFIRMED", "CHECKED_IN"].includes(booking.status)).length;
  $("#booking-empty").classList.toggle("hidden", visible.length > 0);
  $("#booking-list").classList.toggle("hidden", visible.length === 0);
  $("#booking-list").innerHTML = visible.map(booking => {
    const room = getRoom(booking.roomId);
    const isPast = bookingFilter === "past";
    return `<article class="booking-card">
      <div class="booking-date"><span class="day-label">${shortDate(booking.date).split(",")[0]}</span><strong>${booking.date.getDate()}</strong><small>${new Intl.DateTimeFormat("en", { month: "short" }).format(booking.date)}</small></div>
      <div class="booking-info"><div class="booking-roomline"><h3>${room.name}</h3><span class="confirmed-tag">${booking.status.replace("_", " ")}</span></div><div class="booking-detail-line"><span>◷ ${clockTime(booking.start)} – ${clockTime(booking.end)}</span><span>⌖ ${room.building} · ${room.code}</span><span>♙ ${booking.purpose}</span></div></div>
      <div class="booking-actions">${!isPast && booking.status === "CONFIRMED" ? `<button class="checkin-button" data-checkin="${booking.id}">✓ Check in</button><button class="cancel-button" data-cancel="${booking.id}">Cancel</button>` : ""}</div>
    </article>`;
  }).join("");
}

function renderReleased() {
  const released = rooms.filter(room => room.released);
  $("#released-grid").innerHTML = released.map(room => {
    const tags = room.amenities.slice(0, 2).map(item => `<span class="amenity-chip">${item}</span>`).join("");
    return `<article class="room-card"><div class="room-image image-${room.image}"><span class="availability-badge">Just released</span><span class="image-room-code">${room.code}</span></div><div class="room-body"><div class="room-meta">${room.type} room <span>·</span> ${room.code}</div><div class="room-title-row"><h3>${room.name}</h3><span class="distance">↗ ${room.distance}</span></div><div class="room-location">${room.building}</div><div class="room-specs"><span><span class="spec-icon">♙</span>${room.capacity} people</span><span><span class="spec-icon">◷</span>Open now</span></div><div class="amenity-list">${tags}</div><div class="room-card-footer"><span class="next-free">Freed a few minutes ago</span><button class="book-button" data-book="${room.id}">Book room <span>→</span></button></div></div></article>`;
  }).join("");
}

function showView(view) {
  currentView = view;
  document.querySelectorAll(".view-panel").forEach(panel => panel.classList.add("hidden"));
  $(`#${view}-view`).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
  $("#breadcrumb-current").textContent = view === "discover" ? "Find a room" : view === "bookings" ? "My bookings" : view === "released" ? "Just released" : "Campus news";
  if (view === "bookings") renderBookings();
  if (view === "released") renderReleased();
}

function toast(message, icon = "✓") {
  const item = document.createElement("div");
  item.className = "toast";
  item.innerHTML = `<span>${icon}</span><div>${message}</div>`;
  $("#toast-region").append(item);
  window.setTimeout(() => item.remove(), 3500);
}

function showBookingDialog(room) {
  selectedRoom = room;
  const dialog = $("#booking-dialog");
  $("#dialog-content").innerHTML = `<p class="dialog-eyebrow">YOUR NEXT STUDY SESSION</p><h2 class="dialog-title">Book ${room.name}</h2><p class="dialog-description">Your room will be confirmed right away. You can cancel any time before it starts.</p>
    <div class="dialog-summary"><div><span>When</span><strong>${fullDate(new Date(`${$("#date-input").value}T12:00:00`))}</strong></div><div><span>Time</span><strong>${getTimeRange()}</strong></div><div><span>Location</span><strong>${room.building} · ${room.code}</strong></div><div><span>Capacity</span><strong>Up to ${room.capacity} people</strong></div></div>
    <label class="dialog-field">WHAT ARE YOU WORKING ON?<select id="booking-purpose">${room.purpose.map(purpose => `<option>${purpose}</option>`).join("")}</select></label>
    <div class="dialog-actions"><button class="outline-button" id="dialog-cancel">Not now</button><button class="primary-button" id="confirm-booking">Confirm booking <span>→</span></button></div>`;
  dialog.showModal();
  $("#dialog-cancel").addEventListener("click", () => dialog.close());
  $("#confirm-booking").addEventListener("click", confirmBooking);
}

function confirmBooking() {
  if (!selectedRoom || hasActiveBooking(selectedRoom)) {
    $("#booking-dialog").close();
    toast("This room was just taken. Try another nearby space.", "!");
    return;
  }
  const start = $("#start-time").value;
  const end = $("#end-time").value;
  const duration = (Number(end.slice(0, 2)) * 60 + Number(end.slice(3)) - Number(start.slice(0, 2)) * 60 - Number(start.slice(3))) / 60;
  const startDate = new Date(`${$("#date-input").value}T${start}:00`);
  if (duration < .5 || duration > 3) {
    toast("Choose a booking between 30 minutes and 3 hours.", "!");
    return;
  }
  if (startDate < new Date()) {
    toast("Choose a future start time for your booking.", "!");
    return;
  }
  const count = bookings.filter(booking => booking.date >= today && booking.date < new Date(today.getTime() + 7 * 86400000) && booking.status !== "CANCELLED").length;
  if (count >= 5) {
    toast("Weekly limit reached. You can make up to 5 bookings each week.", "!");
    return;
  }
  bookings.push({ id: `bk-${Date.now()}`, roomId: selectedRoom.id, date: new Date(`${$("#date-input").value}T12:00:00`), start, end, purpose: $("#booking-purpose").value, status: "CONFIRMED" });
  const roomName = selectedRoom.name;
  $("#booking-dialog").close();
  renderRooms();
  renderBookings();
  toast(`${roomName} is confirmed for ${clockTime(start)}.`, "✓");
}

function showConfirmation(booking, title, copy, icon = "✓", actionLabel = "Done") {
  const dialog = $("#booking-dialog");
  $("#dialog-content").innerHTML = `<div class="success-mark">${icon}</div><p class="dialog-eyebrow">ROOMLY · YOUR CAMPUS, YOUR SPACE</p><h2 class="dialog-title">${title}</h2><p class="dialog-description">${copy}</p>${booking ? `<div class="dialog-summary"><div><span>Space</span><strong>${getRoom(booking.roomId).name}</strong></div><div><span>Time</span><strong>${clockTime(booking.start)} – ${clockTime(booking.end)}</strong></div><div><span>Location</span><strong>${getRoom(booking.roomId).building} · ${getRoom(booking.roomId).code}</strong></div></div>` : ""}<div class="dialog-actions"><button class="primary-button" id="confirmation-done">${actionLabel}</button></div>`;
  dialog.showModal();
  $("#confirmation-done").addEventListener("click", () => dialog.close());
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-view]");
  if (nav) showView(nav.dataset.view);
  const bookButton = event.target.closest("[data-book]");
  if (bookButton) {
    const room = getRoom(bookButton.dataset.book);
    if (room) showBookingDialog(room);
  }
  const cancel = event.target.closest("[data-cancel]");
  if (cancel) {
    const booking = bookings.find(item => item.id === cancel.dataset.cancel);
    if (!booking) return;
    if (new Date(`${localDate(booking.date)}T${booking.start}:00`) <= new Date()) {
      toast("This booking has already started. Check in instead.", "!");
      return;
    }
    booking.status = "CANCELLED";
    const room = getRoom(booking.roomId);
    room.released = true;
    renderBookings();
    toast("Booking cancelled. The space is now available to others.");
  }
  const checkin = event.target.closest("[data-checkin]");
  if (checkin) {
    const booking = bookings.find(item => item.id === checkin.dataset.checkin);
    if (!booking) return;
    const starts = new Date(`${localDate(booking.date)}T${booking.start}:00`);
    const earliest = new Date(starts.getTime() - 10 * 60000);
    if (new Date() < earliest) { toast(`Check-in opens 10 minutes before ${clockTime(booking.start)}.`, "!"); return; }
    if (new Date() > new Date(starts.getTime() + 15 * 60000)) { booking.status = "NO_SHOW"; renderBookings(); toast("Check-in window passed. This booking was released.", "!"); return; }
    booking.status = "CHECKED_IN";
    renderBookings();
    showConfirmation(booking, "You’re checked in.", "You’re all set. Have a focused, productive session.");
  }
});

$("#search-form").addEventListener("submit", event => {
  event.preventDefault();
  if ($("#end-time").value <= $("#start-time").value) {
    toast("Choose an end time after your start time.", "!");
    $("#end-time").focus();
    return;
  }
  if (Number($("#end-time").value.slice(0, 2)) - Number($("#start-time").value.slice(0, 2)) > 3) {
    toast("Bookings can be up to 3 hours. Adjust your time range.", "!");
    return;
  }
  currentTab = "all";
  document.querySelectorAll(".quick-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === "all"));
  renderRooms();
  toast(`Showing spaces for ${getTimeRange()} on ${shortDate(new Date(`${$("#date-input").value}T12:00:00`))}.`, "⌕");
});
$("#clear-filters").addEventListener("click", () => {
  $("#capacity").value = "1"; $("#room-type").value = "all"; $("#amenity").value = "all"; $("#building").value = "all"; $("#purpose").value = "all";
  currentTab = "all"; document.querySelectorAll(".quick-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === "all")); renderRooms();
});
$("#empty-reset").addEventListener("click", () => $("#clear-filters").click());
$("#sort-select").addEventListener("change", renderRooms);
$("#capacity").addEventListener("change", renderRooms);
$("#room-type").addEventListener("change", renderRooms);
$("#amenity").addEventListener("change", renderRooms);
$("#building").addEventListener("change", renderRooms);
$("#purpose").addEventListener("change", renderRooms);
document.querySelectorAll(".quick-tab").forEach(tab => tab.addEventListener("click", () => {
  currentTab = tab.dataset.tab;
  document.querySelectorAll(".quick-tab").forEach(item => item.classList.toggle("active", item === tab));
  renderRooms();
}));
document.querySelectorAll(".view-toggle").forEach(button => button.addEventListener("click", () => {
  listLayout = button.dataset.layout === "list";
  document.querySelectorAll(".view-toggle").forEach(item => item.classList.toggle("active", item === button));
  renderRooms();
}));
document.querySelectorAll(".booking-tab").forEach(button => button.addEventListener("click", () => {
  bookingFilter = button.dataset.bookingFilter;
  document.querySelectorAll(".booking-tab").forEach(item => item.classList.toggle("active", item === button));
  renderBookings();
}));
$("#find-room-shortcut").addEventListener("click", () => showView("discover"));
$("#booking-empty-search").addEventListener("click", () => showView("discover"));
$("#explore-spaces").addEventListener("click", () => $("#search-section").scrollIntoView({ behavior: "smooth", block: "start" }));
$("#dismiss-announcement").addEventListener("click", () => $("#announcement-banner").remove());
$("#notification-button").addEventListener("click", () => toast("You’re all caught up. We’ll let you know when something changes.", "♧"));
$("#dialog-close").addEventListener("click", () => $("#booking-dialog").close());

renderRooms();
renderBookings();
