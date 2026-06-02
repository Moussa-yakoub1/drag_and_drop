from flask import Flask, render_template, request, send_file, jsonify
import pandas as pd
from io import BytesIO
from datetime import datetime
import traceback

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/export-excel', methods=['POST'])
def export_excel():
    try:
        data = request.json
        print("Received data for export")  # Debug log
        
        # Create a BytesIO object to store the Excel file
        output = BytesIO()
        
        # Create Excel writer with xlsxwriter engine
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            workbook = writer.book
            
            # ===== Sheet 1: Board Overview =====
            overview_data = {
                'Board Title': [data.get('boardTitle', 'Untitled Board')],
                'Export Date': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                'Total Items': [len(data.get('availableItems', []))],
                'Total Sections': [len(data.get('sections', []))],
                'Total Todos': [len(data.get('todos', []))]
            }
            df_overview = pd.DataFrame(overview_data)
            df_overview.to_excel(writer, sheet_name='Overview', index=False)
            
            # Format overview sheet
            worksheet = writer.sheets['Overview']
            worksheet.set_column('A:A', 20)
            worksheet.set_column('B:B', 25)
            
            # ===== Sheet 2: Available Items =====
            items = data.get('availableItems', [])
            items_data = []
            for item in items:
                items_data.append({
                    'Label': item.get('label', ''),
                    'Emoji': item.get('emoji', ''),
                    'Color': item.get('color', '')
                })
            
            if items_data:
                df_items = pd.DataFrame(items_data)
                df_items.to_excel(writer, sheet_name='Available Items', index=False)
                
                worksheet = writer.sheets['Available Items']
                worksheet.set_column('A:A', 25)
                worksheet.set_column('B:B', 10)
                worksheet.set_column('C:C', 15)
            
            # ===== Sheet 3: Sections =====
            sections = data.get('sections', [])
            sections_data = []
            for section in sections:
                section_items = section.get('items', [])
                for item_ref in section_items:
                    item_label = ''
                    for item in items:
                        if item['id'] == item_ref['id']:
                            item_label = item['label']
                            break
                    
                    sections_data.append({
                        'Section': section.get('title', ''),
                        'Item': item_label
                    })
                
                if not section_items:
                    sections_data.append({
                        'Section': section.get('title', ''),
                        'Item': 'No items'
                    })
            
            if sections_data:
                df_sections = pd.DataFrame(sections_data)
                df_sections.to_excel(writer, sheet_name='Sections', index=False)
                
                worksheet = writer.sheets['Sections']
                worksheet.set_column('A:A', 20)
                worksheet.set_column('B:B', 25)
            
            # ===== Sheet 4: Todo List =====
            todos = data.get('todos', [])
            todos_data = []
            for todo in todos:
                subtasks = todo.get('subtasks', [])
                subtasks_text = '; '.join([f"{'✓' if st['completed'] else '○'} {st['text']}" for st in subtasks]) if subtasks else ''
                
                todos_data.append({
                    'Task': todo.get('text', ''),
                    'Status': '✓ Completed' if todo.get('completed') else '○ Pending',
                    'Due Date': todo.get('date', ''),
                    'Subtasks': subtasks_text
                })
            
            if todos_data:
                df_todos = pd.DataFrame(todos_data)
                df_todos.to_excel(writer, sheet_name='Todo List', index=False)
                
                worksheet = writer.sheets['Todo List']
                worksheet.set_column('A:A', 30)
                worksheet.set_column('B:B', 15)
                worksheet.set_column('C:C', 15)
                worksheet.set_column('D:D', 40)
        
        output.seek(0)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"drag_drop_board_{timestamp}.xlsx"
        
        print(f"Sending file: {filename}")  # Debug log
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"Error exporting Excel: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)