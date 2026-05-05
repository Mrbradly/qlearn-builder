/* ============================================================
   MSHS IT HELP DESK
   Frontend interaction script
   public/js/app.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  setupParentApplicationForm();
  setupForgotPasswordForm();
  setupSearchFilters();
  setupDashboardExport();
  setupDeviceInventoryPage();
  setupLoansPage();
  setupSafePlaceholderButtons();
});


/* ============================================================
   SMALL HELPERS
   ============================================================ */

function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function showToast(message, type = 'info') {
  let toast = qs('.app-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }

  toast.className = `app-toast ${type}`;
  toast.textContent = message;
  toast.classList.add('show');

  window.clearTimeout(toast.hideTimer);

  toast.hideTimer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  let result = {};

  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Something went wrong.');
  }

  return result;
}

function setButtonLoading(button, loadingText) {
  if (!button) return () => {};

  const originalHTML = button.innerHTML;

  button.disabled = true;
  button.innerHTML = loadingText;

  return () => {
    button.disabled = false;
    button.innerHTML = originalHTML;
  };
}

function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}


/* ============================================================
   PARENT LAPTOP LOAN APPLICATION FORM
   ============================================================ */

function setupParentApplicationForm() {
  const applicationForm = qs('form.application-card[action="/api/loan-applications"]');

  if (!applicationForm) return;

  const reasonTextarea = qs('textarea[name="reason"]', applicationForm);
  const reasonCounter = reasonTextarea
    ? reasonTextarea.closest('label')?.querySelector('small')
    : null;

  if (reasonTextarea && reasonCounter) {
    const updateCounter = () => {
      const maxLength = reasonTextarea.maxLength > 0 ? reasonTextarea.maxLength : 500;
      reasonCounter.textContent = `${reasonTextarea.value.length} / ${maxLength}`;
    };

    reasonTextarea.addEventListener('input', updateCounter);
    updateCounter();
  }

  applicationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = qs('button[type="submit"]', applicationForm);
    const stopLoading = setButtonLoading(submitButton, 'Submitting...');

    try {
      const rawFormData = new FormData(applicationForm);
      const formData = Object.fromEntries(rawFormData.entries());

      formData.agreement = Boolean(rawFormData.get('agreement'));

      if (!formData.agreement) {
        throw new Error('Please accept the device loan agreement before submitting.');
      }

      const result = await postJSON('/api/loan-applications', formData);

      showToast(
        `Application submitted. Reference: ${result.reference || 'Created'}`,
        'success'
      );

      applicationForm.reset();

      if (reasonCounter) {
        reasonCounter.textContent = '0 / 500';
      }
    } catch (error) {
      showToast(error.message || 'Application could not be submitted.', 'danger');
    } finally {
      stopLoading();
    }
  });
}


/* ============================================================
   FORGOT PASSWORD FORM
   ============================================================ */

function setupForgotPasswordForm() {
  const forgotPasswordForm = qs('form[action="/forgot-password"]');

  if (!forgotPasswordForm) return;

  forgotPasswordForm.addEventListener('submit', () => {
    const submitButton = qs('button[type="submit"]', forgotPasswordForm);
    setButtonLoading(submitButton, 'Sending reset email...');
  });
}


/* ============================================================
   DASHBOARD EXPORT
   ============================================================ */

function setupDashboardExport() {
  const button = qs('#exportDashboardBtn');

  if (!button) return;

  button.addEventListener('click', () => {
    const rows = [
      ['Metric', 'Value'],
      ['Available Loan Laptops', '48'],
      ['Active Short-Term Loans', '76'],
      ['Active Long-Term Loans', '132'],
      ['Overdue Returns', '18'],
      ['Warranty Expiring Soon', '23'],
      ['Open IT Issues', '27']
    ];

    downloadCSV('mshs-it-helpdesk-dashboard.csv', rows);
    showToast('Dashboard exported successfully.', 'success');
  });
}


/* ============================================================
   DEVICE INVENTORY PAGE
   ============================================================ */

function setupDeviceInventoryPage() {
  const table = qs('#devicesTable');
  const rows = qsa('[data-device-row]');

  if (!table || rows.length === 0) return;

  const searchInput = qs('#deviceSearchInput');
  const filterButtons = qsa('[data-device-filter]');
  const resetButton = qs('#resetDeviceFilters');
  const countLabel = qs('#deviceTableCount');
  const exportButton = qs('#exportDevicesBtn');
  const modal = qs('#addDeviceModal');
  const openModalButton = qs('#openAddDeviceModal');
  const addDeviceForm = qs('#addDeviceForm');

  let activeFilter = 'all';

  function updateVisibleRows() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let visibleCount = 0;

    rows.forEach((row) => {
      const status = row.dataset.status || '';
      const searchText = row.dataset.search || row.textContent.toLowerCase();
      const matchesStatus = activeFilter === 'all' || status === activeFilter;
      const matchesSearch = !searchTerm || searchText.includes(searchTerm);
      const isVisible = matchesStatus && matchesSearch;

      row.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount += 1;
    });

    if (countLabel) {
      countLabel.textContent = `Showing ${visibleCount} of ${rows.length} devices`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', updateVisibleRows);
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.deviceFilter || 'all';

      filterButtons.forEach((candidate) => candidate.classList.remove('active'));
      button.classList.add('active');

      updateVisibleRows();
    });
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      activeFilter = 'all';
      if (searchInput) searchInput.value = '';

      filterButtons.forEach((candidate) => {
        candidate.classList.toggle('active', candidate.dataset.deviceFilter === 'all');
      });

      updateVisibleRows();
      showToast('Device filters reset.', 'success');
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const exportRows = [['Asset Number', 'Serial Number', 'Model', 'Device Type', 'Status', 'Warranty Expiry', 'Assigned To']];

      rows.forEach((row) => {
        if (row.style.display === 'none') return;

        const cells = qsa('td', row).slice(0, 7).map((cell) => cell.textContent.trim().replace(/\s+/g, ' '));
        exportRows.push(cells);
      });

      downloadCSV('mshs-device-inventory.csv', exportRows);
      showToast('Device inventory exported successfully.', 'success');
    });
  }

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  if (openModalButton) {
    openModalButton.addEventListener('click', openModal);
  }

  qsa('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
  }

  if (addDeviceForm) {
    addDeviceForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(addDeviceForm).entries());
      showToast(`${data.assetNumber || 'Device'} added to the draft inventory. Database wiring comes next.`, 'success');
      addDeviceForm.reset();
      closeModal();
    });
  }

  qsa('.device-row-action').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();

      qsa('.row-action-menu').forEach((menu) => {
        if (menu !== button.nextElementSibling) menu.hidden = true;
      });

      const menu = button.nextElementSibling;
      if (menu) menu.hidden = !menu.hidden;
    });
  });

  document.addEventListener('click', () => {
    qsa('.row-action-menu').forEach((menu) => {
      menu.hidden = true;
    });
  });

  qsa('.row-action-menu button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const action = button.dataset.action || 'action';
      showToast(`${action.replaceAll('-', ' ')} is ready to connect to the database.`, 'info');
      button.closest('.row-action-menu').hidden = true;
    });
  });

  updateVisibleRows();
}


/* ============================================================
   LOAN MANAGER PAGE
   Tabs, search, filters, assignment modal, reminder preview and CSV export.
   ============================================================ */

function setupLoansPage() {
  const page = qs('[data-loans-page]');
  const table = qs('#loansTable');
  const rows = qsa('[data-loan-row]');

  if (!page || !table) return;

  const searchInput = qs('#loanSearchInput');
  const typeFilter = qs('#loanTypeFilter');
  const yearFilter = qs('#loanYearFilter');
  const statusFilter = qs('#loanStatusFilter');
  const resetButton = qs('#resetLoanFilters');
  const countLabel = qs('#loanTableCount');
  const emptyState = qs('#loansEmptyState');
  const exportButton = qs('#exportLoansBtn');
  const tabButtons = qsa('[data-loan-tab]');

  const assignModal = qs('#assignLaptopModal');
  const reminderModal = qs('#sendReminderModal');
  const assignForm = qs('#assignLaptopForm');
  const reminderForm = qs('#sendReminderForm');
  const assignDeviceSelect = qs('#assignDeviceSelect');
  const assignmentConfirmBox = qs('#assignmentConfirmBox');

  const assignStudentName = qs('#assignStudentName');
  const assignStudentId = qs('#assignStudentId');
  const assignYearLevel = qs('#assignYearLevel');
  const assignLoanType = qs('#assignLoanType');
  const assignExpectedReturn = qs('#assignExpectedReturn');

  const reminderTo = qs('#reminderTo');
  const reminderSubject = qs('#reminderSubject');
  const reminderMessage = qs('#reminderMessage');
  const inlineReminderTo = qs('#inlineReminderTo');
  const inlineReminderSubject = qs('#inlineReminderSubject');
  const inlineReminderMessage = qs('#inlineReminderMessage');

  let activeTab = 'active';
  let selectedLoanRow = rows[0] || null;

  const fallbackDevices = [
    { tag: 'MBA-1047', model: 'MacBook Air' },
    { tag: 'MBA-1088', model: 'MacBook Air' },
    { tag: 'LEN-2031', model: 'Lenovo ThinkPad' },
    { tag: 'HP-1174', model: 'HP ProBook' }
  ];

  function ensureDeviceOptions() {
    if (!assignDeviceSelect) return;
    if (assignDeviceSelect.options.length > 1) return;

    fallbackDevices.forEach((device) => {
      const option = document.createElement('option');
      option.value = device.tag;
      option.dataset.deviceModel = device.model;
      option.textContent = `${device.tag} · ${device.model}`;
      assignDeviceSelect.appendChild(option);
    });
  }

  function loanMatchesTab(row) {
    const status = row.dataset.status || '';
    const tab = row.dataset.tab || '';
    const isActive = row.dataset.active === 'true';

    if (activeTab === 'active') return isActive;
    if (activeTab === 'short-term') return tab === 'short-term';
    if (activeTab === 'long-term') return tab === 'long-term';
    if (activeTab === 'overdue') return status === 'overdue';
    if (activeTab === 'returned') return status === 'returned';

    return true;
  }

  function updateLoanRows() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const typeValue = typeFilter ? typeFilter.value : 'all';
    const yearValue = yearFilter ? yearFilter.value : 'all';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    let visibleCount = 0;

    rows.forEach((row) => {
      const searchText = row.dataset.search || row.textContent.toLowerCase();
      const matchesSearch = !searchTerm || searchText.includes(searchTerm);
      const matchesTab = loanMatchesTab(row);
      const matchesType = typeValue === 'all' || row.dataset.loanType === typeValue;
      const matchesYear = yearValue === 'all' || row.dataset.yearLevel === yearValue;
      const matchesStatus = statusValue === 'all' || row.dataset.status === statusValue;
      const visible = matchesSearch && matchesTab && matchesType && matchesYear && matchesStatus;

      row.style.display = visible ? '' : 'none';
      if (visible) visibleCount += 1;
    });

    if (countLabel) {
      countLabel.textContent = `Showing ${visibleCount} of ${rows.length} loans`;
    }

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  }

  function setActiveTab(nextTab) {
    activeTab = nextTab;
    tabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.loanTab === activeTab);
    });
    updateLoanRows();
  }

  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModals() {
    qsa('#assignLaptopModal, #sendReminderModal').forEach((modal) => {
      modal.hidden = true;
    });
    document.body.style.overflow = '';
  }

  function makeReminderText(row) {
    const studentName = row?.dataset.studentName || 'your child';
    const device = row?.dataset.device || 'school laptop';
    const tag = row?.dataset.deviceTag || 'device tag pending';
    const expected = row?.dataset.expected || 'the due date listed by the school';

    return `Dear Parent/Guardian,\n\nThis is a friendly reminder that ${studentName}'s school device (${device} - ${tag}) is due for return on ${expected}.\n\nPlease ensure the device, charger and any accessories are returned in good condition.\n\nThank you for your support.\nMSHS IT Help Desk`;
  }

  function updateReminderPreview(row) {
    if (!row) return;

    selectedLoanRow = row;
    rows.forEach((candidate) => candidate.classList.toggle('selected', candidate === row));

    const studentName = row.dataset.studentName || 'Selected student';
    const studentId = row.dataset.studentId || 'Student ID';
    const toText = `${studentName} family (${studentId})`;
    const subjectText = `Upcoming device return reminder - ${studentName}`;
    const messageText = makeReminderText(row);

    if (inlineReminderTo) inlineReminderTo.value = toText;
    if (inlineReminderSubject) inlineReminderSubject.value = subjectText;
    if (inlineReminderMessage) inlineReminderMessage.value = messageText;

    if (reminderTo) reminderTo.value = toText;
    if (reminderSubject) reminderSubject.value = subjectText;
    if (reminderMessage) reminderMessage.value = messageText;
  }

  function updateAssignmentPreview() {
    if (!assignmentConfirmBox) return;

    const option = assignDeviceSelect?.selectedOptions?.[0];
    const studentName = assignStudentName?.value?.trim() || 'Selected student';
    const studentId = assignStudentId?.value?.trim() || 'student ID pending';
    const year = assignYearLevel?.value ? `Year ${assignYearLevel.value}` : 'year level pending';
    const type = assignLoanType?.value || 'Short-Term';
    const deviceTag = assignDeviceSelect?.value || 'device pending';
    const deviceModel = option?.dataset?.deviceModel || option?.textContent?.split('·')?.[1]?.trim() || 'Laptop';
    const returnDate = assignExpectedReturn?.value || 'return date pending';

    assignmentConfirmBox.innerHTML = `<strong>Confirm assignment:</strong> ${studentName} (${studentId}, ${year}) will receive <strong>${deviceModel}</strong> <span>${deviceTag}</span> as a <strong>${type}</strong> loan. Expected return: <strong>${returnDate}</strong>.`;
  }

  function fillAssignFromQueue(queueRow) {
    if (!queueRow) return;

    if (assignStudentName) assignStudentName.value = queueRow.dataset.studentName || '';
    if (assignStudentId) assignStudentId.value = queueRow.dataset.studentId || '';
    if (assignYearLevel) assignYearLevel.value = queueRow.dataset.yearLevel || '';
    if (assignLoanType) assignLoanType.value = queueRow.dataset.loanType || 'Short-Term';

    updateAssignmentPreview();
    openModal(assignModal);
  }

  function openReminderForRow(row) {
    updateReminderPreview(row || selectedLoanRow || rows[0]);
    openModal(reminderModal);
  }

  function exportLoansCsv() {
    const exportRows = [[
      'Student',
      'Student ID',
      'Year Level',
      'Device',
      'Device Tag',
      'Loan Type',
      'Expected Return',
      'Status',
      'Reminder'
    ]];

    rows.forEach((row) => {
      if (row.style.display === 'none') return;
      exportRows.push([
        row.dataset.studentName || '',
        row.dataset.studentId || '',
        row.dataset.yearLevel || '',
        row.dataset.device || '',
        row.dataset.deviceTag || '',
        row.dataset.loanType || '',
        row.dataset.expected || '',
        row.dataset.status || '',
        qs('[data-reminder-state]', row)?.textContent?.trim() || ''
      ]);
    });

    downloadCSV('mshs-loans-filtered-export.csv', exportRows);
    showToast('Loans CSV exported using the current filtered view.', 'success');
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.loanTab || 'active'));
  });

  [searchInput, typeFilter, yearFilter, statusFilter].forEach((control) => {
    if (!control) return;
    control.addEventListener('input', updateLoanRows);
    control.addEventListener('change', updateLoanRows);
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeFilter) typeFilter.value = 'all';
      if (yearFilter) yearFilter.value = 'all';
      if (statusFilter) statusFilter.value = 'all';
      setActiveTab('active');
      showToast('Loan filters reset.', 'success');
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', exportLoansCsv);
  }

  const openAssignLaptopModal = qs('#openAssignLaptopModal');
  if (openAssignLaptopModal) {
    openAssignLaptopModal.addEventListener('click', () => {
      ensureDeviceOptions();
      updateAssignmentPreview();
      openModal(assignModal);
    });
  }

  qsa('[data-open-assign-from-queue]').forEach((button) => {
    button.addEventListener('click', () => {
      ensureDeviceOptions();
      fillAssignFromQueue(button.closest('[data-queue-student]'));
    });
  });

  const openReminderModalButton = qs('#openReminderModal');
  if (openReminderModalButton) {
    openReminderModalButton.addEventListener('click', () => openReminderForRow(selectedLoanRow || rows[0]));
  }

  const openReminderFromPreview = qs('#openReminderFromPreview');
  if (openReminderFromPreview) {
    openReminderFromPreview.addEventListener('click', () => openReminderForRow(selectedLoanRow || rows[0]));
  }

  qsa('[data-close-loan-modal]').forEach((button) => {
    button.addEventListener('click', closeModals);
  });

  qsa('#assignLaptopModal, #sendReminderModal').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModals();
    });
  });

  rows.forEach((row) => {
    row.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      updateReminderPreview(row);
    });
  });

  qsa('.loan-row-action').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      qsa('.polished-loans-table .row-action-menu').forEach((menu) => {
        if (menu !== button.nextElementSibling) menu.hidden = true;
      });
      const menu = button.nextElementSibling;
      if (menu) menu.hidden = !menu.hidden;
    });
  });

  document.addEventListener('click', () => {
    qsa('.polished-loans-table .row-action-menu').forEach((menu) => {
      menu.hidden = true;
    });
  });

  qsa('[data-open-row-reminder]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openReminderForRow(button.closest('[data-loan-row]'));
    });
  });

  qsa('[data-mark-returned]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const row = button.closest('[data-loan-row]');
      if (!row) return;
      row.dataset.status = 'returned';
      row.dataset.tab = 'returned';
      row.dataset.active = 'false';
      const status = qs('.status', row);
      if (status) {
        status.className = 'status returned';
        status.textContent = 'returned';
      }
      showToast(`${row.dataset.studentName || 'Loan'} marked as returned. Database save comes next.`, 'success');
      updateLoanRows();
    });
  });

  qsa('[data-view-loan]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const row = button.closest('[data-loan-row]');
      showToast(`${row?.dataset?.studentName || 'Loan'} details panel can be wired next.`, 'info');
    });
  });

  [assignStudentName, assignStudentId, assignYearLevel, assignLoanType, assignExpectedReturn, assignDeviceSelect].forEach((control) => {
    if (!control) return;
    control.addEventListener('input', updateAssignmentPreview);
    control.addEventListener('change', updateAssignmentPreview);
  });

  if (assignForm) {
    assignForm.addEventListener('submit', (event) => {
      event.preventDefault();
      ensureDeviceOptions();

      const data = Object.fromEntries(new FormData(assignForm).entries());
      if (!data.studentName || !data.deviceTag) {
        showToast('Select a student and an available device before assigning.', 'danger');
        return;
      }

      qsa('[data-queue-student]').forEach((queueRow) => {
        const sameStudent = (queueRow.dataset.studentName || '') === data.studentName;
        if (sameStudent) queueRow.remove();
      });

      showToast(`${data.deviceTag} assigned to ${data.studentName}. Database save comes next.`, 'success');
      assignForm.reset();
      updateAssignmentPreview();
      closeModals();
    });
  }

  if (reminderForm) {
    reminderForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (selectedLoanRow) {
        const reminderState = qs('[data-reminder-state]', selectedLoanRow);
        if (reminderState) {
          reminderState.textContent = 'Sent today';
          reminderState.classList.add('sent');
        }
      }

      showToast('Reminder marked as sent. Email delivery can be wired later.', 'success');
      closeModals();
    });
  }

  ensureDeviceOptions();
  if (rows[0]) updateReminderPreview(rows[0]);
  setActiveTab('active');
}


/* ============================================================
   GENERAL TABLE SEARCH
   Searches only the closest table in the same card/section.
   Device page has its own stronger search above.
   ============================================================ */

function setupSearchFilters() {
  qsa('.search-box input').forEach((input) => {
    if (input.id === 'deviceSearchInput') return;

    input.addEventListener('input', () => {
      const searchTerm = input.value.trim().toLowerCase();
      const searchArea = input.closest('.card') || input.closest('section') || document;
      const table = qs('table', searchArea);

      if (!table) return;

      qsa('tbody tr', table).forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? '' : 'none';
      });
    });
  });
}


/* ============================================================
   SAFE PLACEHOLDER BUTTONS
   Keeps the UI feeling alive before each page is wired properly.
   We will replace these with real interactions page by page.
   ============================================================ */

function setupSafePlaceholderButtons() {
  const placeholderLabels = [
    'Assign Laptop',
    'Send Reminder',
    'Report Issue',
    'New Damage Report',
    'Export Loans',
    'Export Issues',
    'Filters',
    'All Loan Types',
    'All Years',
    'All Statuses',
    'All Status',
    'All Urgency',
    'All Issue Types',
    'This Month',
    'Edit Device',
    'Assign Device',
    'Mark Returned',
    'Archive'
  ];

  qsa('button, a.btn').forEach((button) => {
    const label = cleanButtonLabel(button.textContent || '');

    if (!label) return;
    if (button.type === 'submit') return;
    if (button.id === 'openAddDeviceModal') return;
    if (button.id === 'exportDevicesBtn') return;
    if (button.id === 'exportDashboardBtn') return;
    if (button.closest('[data-loans-page]')) return;
    if (button.closest('#addDeviceModal')) return;
    if (button.tagName === 'A' && button.getAttribute('href')) return;

    const isPlaceholder = placeholderLabels.some((placeholderLabel) =>
      label.toLowerCase().includes(placeholderLabel.toLowerCase())
    );

    if (!isPlaceholder) return;

    button.addEventListener('click', () => {
      showToast(`${label} is ready to wire on this page.`, 'info');
    });
  });

  qsa('.icon-btn').forEach((button) => {
    if (button.classList.contains('device-row-action')) return;
    if (button.classList.contains('loan-row-action')) return;

    button.addEventListener('click', () => {
      showToast('Record actions will be wired when we build this page.', 'info');
    });
  });
}

function cleanButtonLabel(label) {
  return String(label)
    .replace(/[＋⊕⇩✉♙▽˅›⋮⌕]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================
   CORE PAGE STABILITY PATCH
   Safer Devices modal, filters and row actions.
   This replacement function overrides the earlier function by name.
   ============================================================ */

function setupDeviceInventoryPage() {
  const table = qs('#devicesTable');
  const rows = qsa('[data-device-row]');

  if (!table || rows.length === 0) return;

  const searchInput = qs('#deviceSearchInput');
  const filterButtons = qsa('[data-device-filter]');
  const resetButton = qs('#resetDeviceFilters');
  const countLabel = qs('#deviceTableCount');
  const emptyState = qs('#devicesEmptyState');
  const exportButton = qs('#exportDevicesBtn');
  const modal = qs('#addDeviceModal');
  const modalCard = modal ? qs('.modal-card', modal) : null;
  const openModalButton = qs('#openAddDeviceModal');
  const addDeviceForm = qs('#addDeviceForm');

  let activeFilter = 'all';

  function syncActiveFilterButtons() {
    filterButtons.forEach((button) => {
      button.classList.toggle('active', (button.dataset.deviceFilter || 'all') === activeFilter);
    });
  }

  function updateVisibleRows() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let visibleCount = 0;

    rows.forEach((row) => {
      const status = row.dataset.status || '';
      const searchText = row.dataset.search || row.textContent.toLowerCase();
      const matchesStatus = activeFilter === 'all' || status === activeFilter;
      const matchesSearch = !searchTerm || searchText.includes(searchTerm);
      const isVisible = matchesStatus && matchesSearch;

      row.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount += 1;
    });

    if (countLabel) {
      countLabel.textContent = `Showing ${visibleCount} of ${rows.length} devices`;
    }

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }

    syncActiveFilterButtons();
  }

  function setDeviceFilter(nextFilter) {
    activeFilter = nextFilter || 'all';
    updateVisibleRows();
  }

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    const firstField = qs('input, select, textarea, button', modal);
    if (firstField) window.setTimeout(() => firstField.focus(), 30);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function closeAllRowMenus(exceptMenu = null) {
    qsa('.row-action-menu').forEach((menu) => {
      if (menu !== exceptMenu) menu.hidden = true;
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', updateVisibleRows);
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setDeviceFilter(button.dataset.deviceFilter || 'all');
    });
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      activeFilter = 'all';
      if (searchInput) searchInput.value = '';
      updateVisibleRows();
      showToast('Device filters reset.', 'success');
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const exportRows = [['Asset Number', 'Serial Number', 'Model', 'Device Type', 'Status', 'Warranty Expiry', 'Assigned To']];

      rows.forEach((row) => {
        if (row.style.display === 'none') return;
        const cells = qsa('td', row)
          .slice(0, 7)
          .map((cell) => cell.textContent.trim().replace(/\s+/g, ' '));
        exportRows.push(cells);
      });

      downloadCSV('mshs-device-inventory.csv', exportRows);
      showToast('Device inventory exported successfully.', 'success');
    });
  }

  if (modal) {
    modal.hidden = true;

    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
  }

  if (modalCard) {
    modalCard.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  if (openModalButton) {
    openModalButton.addEventListener('click', openModal);
  }

  qsa('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeAllRowMenus();
    }
  });

  if (addDeviceForm) {
    addDeviceForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(addDeviceForm).entries());
      showToast(`${data.assetNumber || 'Device'} added to the draft inventory. Database save comes next.`, 'success');
      addDeviceForm.reset();
      closeModal();
    });
  }

  qsa('.device-row-action').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const menu = button.nextElementSibling;
      const shouldOpen = menu && menu.hidden;
      closeAllRowMenus(menu);
      if (menu) menu.hidden = !shouldOpen;
    });
  });

  qsa('.row-action-menu').forEach((menu) => {
    menu.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  });

  document.addEventListener('click', () => {
    closeAllRowMenus();
  });

  qsa('.row-action-menu button').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const action = button.dataset.action || 'action';
      showToast(`${action.replaceAll('-', ' ')} is ready to connect to the database.`, 'info');
      const menu = button.closest('.row-action-menu');
      if (menu) menu.hidden = true;
    });
  });

  updateVisibleRows();
}
