// ==================== DATA MANAGEMENT ====================
const STORAGE_KEY = 'dragDropBoardData_v6';

const defaultData = {
  boardTitle: 'My Drag & Drop Board',
  availableItems: [
    { id: 'item-1', label: 'Notebook', emoji: '📓', color: '#667eea' },
    { id: 'item-2', label: 'Camera', emoji: '📷', color: '#48bb78' },
    { id: 'item-3', label: 'Plant', emoji: '🪴', color: '#38b2ac' },
    { id: 'item-4', label: 'Coffee', emoji: '☕', color: '#ed8936' },
    { id: 'item-5', label: 'Book', emoji: '📚', color: '#9f7aea' },
    { id: 'item-6', label: 'Laptop', emoji: '💻', color: '#e53e3e' },
  ],
  sections: [
    { id: 'section-1', title: 'To Do', items: [] },
    { id: 'section-2', title: 'In Progress', items: [] },
    { id: 'section-3', title: 'Done', items: [] }
  ],
  todos: [
    {
      id: 'todo-1',
      text: 'Complete project setup',
      date: '2024-12-20',
      completed: false,
      expanded: true,
      subtasks: [
        { id: 'sub-1', text: 'Install dependencies', completed: true },
        { id: 'sub-2', text: 'Configure webpack', completed: false }
      ]
    },
    {
      id: 'todo-2',
      text: 'Review drag & drop feature',
      date: '2024-12-22',
      completed: false,
      expanded: false,
      subtasks: [
        { id: 'sub-3', text: 'Test browser compatibility', completed: false }
      ]
    }
  ]
};

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedData = JSON.parse(stored);
      if (parsedData && parsedData.availableItems && parsedData.sections && parsedData.todos) {
        parsedData.availableItems = parsedData.availableItems.map(item => ({
          ...item,
          color: item.color || '#667eea'
        }));
        parsedData.todos = parsedData.todos.map(todo => ({
          ...todo,
          expanded: todo.expanded !== undefined ? todo.expanded : false,
          subtasks: todo.subtasks || []
        }));
        return parsedData;
      }
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

let appData = loadData();
let draggedItemId = null;
let selectedColor = '#667eea';

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getItemById(itemId) {
  return appData.availableItems.find(item => item.id === itemId);
}

function getSectionById(sectionId) {
  return appData.sections.find(section => section.id === sectionId);
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
}

function isDateOverdue(dateString) {
  if (!dateString) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateString.split('-');
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  } catch (e) {
    return false;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== RENDER FUNCTIONS ====================
function renderBoardTitle() {
  document.getElementById('mainTitle').textContent = appData.boardTitle;
}

function renderTodoList() {
  const todoList = document.getElementById('todoList');
  if (!todoList) return;
  
  todoList.innerHTML = '';
  
  if (appData.todos.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'drop-placeholder';
    emptyMessage.textContent = 'No tasks yet';
    todoList.appendChild(emptyMessage);
    return;
  }
  
  const sortedTodos = [...appData.todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return 0;
  });
  
  sortedTodos.forEach(todo => {
    const todoElement = document.createElement('div');
    todoElement.className = `todo-item${todo.completed ? ' completed' : ''}`;
    
    const isOverdue = !todo.completed && isDateOverdue(todo.date);
    const subtaskCount = todo.subtasks ? todo.subtasks.length : 0;
    const completedSubtaskCount = todo.subtasks ? todo.subtasks.filter(st => st.completed).length : 0;
    
    todoElement.innerHTML = `
      <div class="todo-item-header">
        <button class="expand-btn${todo.expanded ? ' expanded' : ''}">
          ${subtaskCount > 0 ? '▶' : '•'}
        </button>
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
      </div>
      ${todo.date ? `
        <div class="todo-date${isOverdue ? ' overdue' : ''}">
          📅 ${formatDate(todo.date)}${isOverdue ? ' ⚠️ Overdue' : ''}
          ${subtaskCount > 0 ? ` • ${completedSubtaskCount}/${subtaskCount} subtasks` : ''}
        </div>
      ` : ''}
      <div class="todo-actions">
        <button class="todo-action-btn add-subtask-action-btn" title="Add subtask">📎</button>
        <button class="todo-action-btn delete-todo-btn" title="Delete todo">🗑️</button>
      </div>
      <div class="subtasks-container${todo.expanded ? '' : ' hidden'}">
        ${renderSubtasks(todo)}
        <div class="add-subtask-form">
          <input type="text" class="subtask-input" placeholder="New subtask..." maxlength="100">
          <button class="add-subtask-btn">Add</button>
        </div>
      </div>
    `;
    
    const expandBtn = todoElement.querySelector('.expand-btn');
    const checkbox = todoElement.querySelector('.todo-checkbox');
    const deleteBtn = todoElement.querySelector('.delete-todo-btn');
    const addSubtaskBtn = todoElement.querySelector('.add-subtask-btn');
    const subtaskInput = todoElement.querySelector('.subtask-input');
    const addSubtaskActionBtn = todoElement.querySelector('.add-subtask-action-btn');
    
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTodoExpand(todo.id);
    });
    
    checkbox.addEventListener('change', () => {
      toggleTodoComplete(todo.id);
    });
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTodo(todo.id);
    });
    
    addSubtaskActionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!todo.expanded) toggleTodoExpand(todo.id);
      setTimeout(() => {
        const input = todoElement.querySelector('.subtask-input');
        if (input) input.focus();
      }, 100);
    });
    
    addSubtaskBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = subtaskInput.value.trim();
      if (text) {
        addSubtask(todo.id, text);
        subtaskInput.value = '';
      }
    });
    
    subtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        const text = subtaskInput.value.trim();
        if (text) {
          addSubtask(todo.id, text);
          subtaskInput.value = '';
        }
      }
    });
    
    const subtaskCheckboxes = todoElement.querySelectorAll('.subtask-checkbox');
    const deleteSubtaskBtns = todoElement.querySelectorAll('.delete-subtask-btn');
    
    subtaskCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleSubtaskComplete(todo.id, cb.dataset.subtaskId);
      });
    });
    
    deleteSubtaskBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSubtask(todo.id, btn.dataset.subtaskId);
      });
    });
    
    todoList.appendChild(todoElement);
  });
}

function renderSubtasks(todo) {
  if (!todo.subtasks || todo.subtasks.length === 0) return '';
  
  return todo.subtasks.map(subtask => `
    <div class="subtask-item">
      <input type="checkbox" class="subtask-checkbox" data-subtask-id="${subtask.id}" ${subtask.completed ? 'checked' : ''}>
      <span class="subtask-text${subtask.completed ? ' completed' : ''}">${escapeHtml(subtask.text)}</span>
      <button class="delete-subtask-btn" data-subtask-id="${subtask.id}" title="Delete subtask">✕</button>
    </div>
  `).join('');
}

function renderAvailableItems() {
  const itemsShelf = document.getElementById('itemsShelf');
  if (!itemsShelf) return;
  
  itemsShelf.innerHTML = '';
  
  appData.availableItems.forEach(item => {
    const itemElement = createDraggableItem(item);
    itemsShelf.appendChild(itemElement);
  });
}

function createDraggableItem(item) {
  const div = document.createElement('div');
  div.className = 'drag-item';
  div.draggable = true;
  div.dataset.itemId = item.id;
  div.style.setProperty('--item-color', item.color || '#667eea');
  div.innerHTML = `
    <span class="item-color-dot" style="background: ${item.color || '#667eea'};"></span>
    <span class="item-emoji">${item.emoji || '📦'}</span>
    <span>${escapeHtml(item.label)}</span>
    <button class="delete-item-btn" title="Delete item">✕</button>
  `;
  
  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragend', handleDragEnd);
  
  const deleteBtn = div.querySelector('.delete-item-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    deleteAvailableItem(item.id);
  });
  
  return div;
}

function renderAllSections() {
  const container = document.getElementById('dropSectionsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  appData.sections.forEach(section => {
    const sectionElement = createSectionElement(section);
    container.appendChild(sectionElement);
  });
}

function createSectionElement(section) {
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'drop-section';
  sectionDiv.dataset.sectionId = section.id;
  
  sectionDiv.innerHTML = `
    <div class="section-header">
      <h3 class="section-title" contenteditable="true">${escapeHtml(section.title)}</h3>
      <div class="section-actions">
        <button class="section-action-btn edit-section-title" title="Edit section title">✏️</button>
        <button class="section-action-btn delete-section" title="Delete section">🗑️</button>
      </div>
    </div>
    <div class="drop-zone">
      ${section.items.length === 0 ? '<div class="drop-placeholder">Drop items here</div>' : ''}
    </div>
  `;
  
  const dropZone = sectionDiv.querySelector('.drop-zone');
  const sectionTitle = sectionDiv.querySelector('.section-title');
  const editBtn = sectionDiv.querySelector('.edit-section-title');
  const deleteBtn = sectionDiv.querySelector('.delete-section');
  
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragenter', handleDragEnter);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  
  sectionTitle.addEventListener('blur', () => {
    const newTitle = sectionTitle.textContent.trim();
    if (newTitle && newTitle !== section.title) {
      updateSectionTitle(section.id, newTitle);
    } else {
      sectionTitle.textContent = section.title;
    }
  });
  
  sectionTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sectionTitle.blur();
    }
  });
  
  editBtn.addEventListener('click', () => {
    sectionTitle.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(sectionTitle);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  });
  
  deleteBtn.addEventListener('click', () => {
    if (confirm(`Delete section "${section.title}"?`)) {
      deleteSection(section.id);
    }
  });
  
  renderDroppedItems(dropZone, section);
  
  return sectionDiv;
}

function renderDroppedItems(dropZone, section) {
  if (!dropZone) return;
  
  const existingItems = dropZone.querySelectorAll('.dropped-item');
  existingItems.forEach(item => item.remove());
  
  const placeholder = dropZone.querySelector('.drop-placeholder');
  
  if (!section.items || section.items.length === 0) {
    if (!placeholder) {
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'drop-placeholder';
      placeholderDiv.textContent = 'Drop items here';
      dropZone.appendChild(placeholderDiv);
    }
  } else {
    if (placeholder) placeholder.remove();
    
    section.items.forEach(itemData => {
      const item = getItemById(itemData.id);
      if (item) {
        const droppedItem = document.createElement('div');
        droppedItem.className = 'dropped-item';
        droppedItem.style.setProperty('--item-color', item.color || '#667eea');
        droppedItem.innerHTML = `
          <span class="item-color-dot" style="background: ${item.color || '#667eea'};"></span>
          <span class="item-emoji">${item.emoji || '📦'}</span>
          <span>${escapeHtml(item.label)}</span>
          <button class="remove-item-btn" title="Remove from section">✕</button>
        `;
        
        const removeBtn = droppedItem.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeItemFromSection(section.id, item.id);
        });
        
        dropZone.appendChild(droppedItem);
      }
    });
  }
}

// ==================== DRAG & DROP HANDLERS ====================
function handleDragStart(e) {
  draggedItemId = this.dataset.itemId;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedItemId);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedItemId = null;
  document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drag-over'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  
  const itemId = e.dataTransfer.getData('text/plain');
  if (!itemId) return;
  
  const sectionElement = this.closest('.drop-section');
  if (!sectionElement) return;
  
  const sectionId = sectionElement.dataset.sectionId;
  if (sectionId) {
    addItemToSection(sectionId, itemId);
  }
}

// ==================== DATA OPERATIONS ====================
function addNewItem(label) {
  if (!label || label.trim() === '') return;
  
  appData.availableItems.push({
    id: generateId(),
    label: label.trim(),
    emoji: '📦',
    color: selectedColor
  });
  
  saveData();
  renderAvailableItems();
}

function deleteAvailableItem(itemId) {
  const item = getItemById(itemId);
  if (!item) return;
  
  if (confirm(`Delete "${item.label}"? It will also be removed from all sections.`)) {
    appData.availableItems = appData.availableItems.filter(item => item.id !== itemId);
    appData.sections.forEach(section => {
      section.items = section.items.filter(item => item.id !== itemId);
    });
    
    saveData();
    renderAvailableItems();
    renderAllSections();
  }
}

function addItemToSection(sectionId, itemId) {
  const section = getSectionById(sectionId);
  const item = getItemById(itemId);
  
  if (!section || !item) return;
  
  const existingItem = section.items.find(i => i.id === itemId);
  if (!existingItem) {
    section.items.push({ id: itemId });
    saveData();
    
    const dropZone = document.querySelector(`.drop-section[data-section-id="${sectionId}"] .drop-zone`);
    if (dropZone) renderDroppedItems(dropZone, section);
  }
}

function removeItemFromSection(sectionId, itemId) {
  const section = getSectionById(sectionId);
  if (!section) return;
  
  section.items = section.items.filter(item => item.id !== itemId);
  saveData();
  
  const dropZone = document.querySelector(`.drop-section[data-section-id="${sectionId}"] .drop-zone`);
  if (dropZone) renderDroppedItems(dropZone, section);
}

function addNewSection() {
  appData.sections.push({
    id: generateId(),
    title: 'New Section',
    items: []
  });
  
  saveData();
  renderAllSections();
}

function deleteSection(sectionId) {
  appData.sections = appData.sections.filter(section => section.id !== sectionId);
  saveData();
  renderAllSections();
}

function updateSectionTitle(sectionId, newTitle) {
  const section = getSectionById(sectionId);
  if (section && newTitle && newTitle.trim() !== '') {
    section.title = newTitle.trim();
    saveData();
  }
}

function updateBoardTitle(newTitle) {
  if (newTitle && newTitle.trim() !== '') {
    appData.boardTitle = newTitle.trim();
    saveData();
  }
}

function clearAllSections() {
  appData.sections.forEach(section => section.items = []);
  saveData();
  renderAllSections();
}

function resetAll() {
  if (confirm('Reset everything to default? This cannot be undone.')) {
    appData = JSON.parse(JSON.stringify(defaultData));
    saveData();
    renderAll();
  }
}

// Todo Operations
function addTodo(text, date) {
  if (!text || text.trim() === '') return;
  
  appData.todos.push({
    id: generateId(),
    text: text.trim(),
    date: date || '',
    completed: false,
    expanded: false,
    subtasks: []
  });
  
  saveData();
  renderTodoList();
}

function toggleTodoComplete(todoId) {
  const todo = appData.todos.find(t => t.id === todoId);
  if (todo) {
    todo.completed = !todo.completed;
    saveData();
    renderTodoList();
  }
}

function toggleTodoExpand(todoId) {
  const todo = appData.todos.find(t => t.id === todoId);
  if (todo) {
    todo.expanded = !todo.expanded;
    saveData();
    renderTodoList();
  }
}

function deleteTodo(todoId) {
  appData.todos = appData.todos.filter(t => t.id !== todoId);
  saveData();
  renderTodoList();
}

function addSubtask(todoId, text) {
  const todo = appData.todos.find(t => t.id === todoId);
  if (todo && text.trim()) {
    if (!todo.subtasks) todo.subtasks = [];
    todo.subtasks.push({
      id: generateId(),
      text: text.trim(),
      completed: false
    });
    saveData();
    renderTodoList();
  }
}

function toggleSubtaskComplete(todoId, subtaskId) {
  const todo = appData.todos.find(t => t.id === todoId);
  if (todo && todo.subtasks) {
    const subtask = todo.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      saveData();
      renderTodoList();
    }
  }
}

function deleteSubtask(todoId, subtaskId) {
  const todo = appData.todos.find(t => t.id === todoId);
  if (todo && todo.subtasks) {
    todo.subtasks = todo.subtasks.filter(st => st.id !== subtaskId);
    saveData();
    renderTodoList();
  }
}

// ==================== EXPORT TO EXCEL (Pure JavaScript - No Backend Needed) ====================
function exportToExcel() {
  const exportBtn = document.getElementById('exportExcelBtn');
  
  try {
    // Show loading state
    exportBtn.disabled = true;
    exportBtn.innerHTML = '<span>⏳</span> Exporting...';
    
    // Create CSV content
    let csvContent = '';
    
    // Add Board Title
    csvContent += `Board Title:,${appData.boardTitle}\n`;
    csvContent += `Export Date:,${new Date().toLocaleString()}\n\n`;
    
    // Available Items
    csvContent += 'AVAILABLE ITEMS\n';
    csvContent += 'Label,Emoji,Color\n';
    appData.availableItems.forEach(item => {
      csvContent += `"${item.label}","${item.emoji}","${item.color}"\n`;
    });
    csvContent += '\n';
    
    // Sections with Items
    csvContent += 'SECTIONS\n';
    csvContent += 'Section,Item\n';
    appData.sections.forEach(section => {
      if (section.items.length === 0) {
        csvContent += `"${section.title}","No items"\n`;
      } else {
        section.items.forEach(itemRef => {
          const item = getItemById(itemRef.id);
          if (item) {
            csvContent += `"${section.title}","${item.label}"\n`;
          }
        });
      }
    });
    csvContent += '\n';
    
    // Todo List
    csvContent += 'TODO LIST\n';
    csvContent += 'Task,Status,Due Date,Subtasks\n';
    appData.todos.forEach(todo => {
      const subtasks = todo.subtasks || [];
      const subtasksText = subtasks.map(st => 
        `${st.completed ? '✓' : '○'} ${st.text}`
      ).join('; ');
      
      csvContent += `"${todo.text}","${todo.completed ? 'Completed' : 'Pending'}",`;
      csvContent += `"${todo.date || 'No date'}","${subtasksText || 'No subtasks'}"\n`;
    });
    
    // Create and download the file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with date
    const date = new Date();
    const filename = `drag_drop_board_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.csv`;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    showNotification('Data exported successfully! 📊 (Opens in Excel)', 'success');
    
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Export failed: ' + error.message, 'error');
  } finally {
    // Reset button
    exportBtn.disabled = false;
    exportBtn.innerHTML = '<span>📊</span> Export to Excel';
  }
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.8rem;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  `;
  
  switch(type) {
    case 'success':
      notification.style.background = '#48bb78';
      break;
    case 'error':
      notification.style.background = '#e53e3e';
      break;
    default:
      notification.style.background = '#667eea';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ==================== EVENT SETUP ====================
function setupEventListeners() {
  // Board title
  document.getElementById('mainTitle').addEventListener('blur', function() {
    const newTitle = this.textContent.trim();
    if (newTitle && newTitle !== appData.boardTitle) {
      updateBoardTitle(newTitle);
    } else {
      this.textContent = appData.boardTitle;
    }
  });
  
  document.getElementById('mainTitle').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.blur();
    }
  });
  
  document.getElementById('editTitleBtn').addEventListener('click', function() {
    const title = document.getElementById('mainTitle');
    title.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(title);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  });
  
  // Color picker
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      selectedColor = this.dataset.color;
    });
  });
  
  // Add item
  document.getElementById('showAddItemBtn').addEventListener('click', function() {
    const form = document.getElementById('addItemForm');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      document.getElementById('newItemInput').focus();
    }
  });
  
  document.getElementById('confirmAddBtn').addEventListener('click', function() {
    const input = document.getElementById('newItemInput');
    const label = input.value.trim();
    if (label) {
      addNewItem(label);
      input.value = '';
      document.getElementById('addItemForm').classList.add('hidden');
    }
  });
  
  document.getElementById('cancelAddBtn').addEventListener('click', function() {
    document.getElementById('newItemInput').value = '';
    document.getElementById('addItemForm').classList.add('hidden');
  });
  
  document.getElementById('newItemInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const label = this.value.trim();
      if (label) {
        addNewItem(label);
        this.value = '';
        document.getElementById('addItemForm').classList.add('hidden');
      }
    }
  });
  
  // Add todo
  document.getElementById('showAddTodoBtn').addEventListener('click', function() {
    const form = document.getElementById('addTodoForm');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      document.getElementById('newTodoInput').focus();
      const today = new Date();
      document.getElementById('newTodoDate').value = today.toISOString().split('T')[0];
    }
  });
  
  document.getElementById('confirmTodoBtn').addEventListener('click', function() {
    const text = document.getElementById('newTodoInput').value.trim();
    const date = document.getElementById('newTodoDate').value;
    if (text) {
      addTodo(text, date);
      document.getElementById('newTodoInput').value = '';
      document.getElementById('newTodoDate').value = '';
      document.getElementById('addTodoForm').classList.add('hidden');
    }
  });
  
  document.getElementById('cancelTodoBtn').addEventListener('click', function() {
    document.getElementById('newTodoInput').value = '';
    document.getElementById('newTodoDate').value = '';
    document.getElementById('addTodoForm').classList.add('hidden');
  });
  
  // Global controls
  document.getElementById('addSectionBtn').addEventListener('click', addNewSection);
  
  document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
  
  document.getElementById('clearAllBtn').addEventListener('click', function() {
    if (confirm('Clear all items from all sections?')) {
      clearAllSections();
    }
  });
  
  document.getElementById('resetAllBtn').addEventListener('click', resetAll);
}

// ==================== INITIALIZATION ====================
function renderAll() {
  renderBoardTitle();
  renderTodoList();
  renderAvailableItems();
  renderAllSections();
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Drag & Drop Board...');
  setupEventListeners();
  renderAll();
  console.log('Board initialized successfully');
});

window.addEventListener('blur', function() {
  draggedItemId = null;
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
});