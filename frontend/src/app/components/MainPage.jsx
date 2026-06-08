"use client";

import { title } from 'process';
import React, { useState, useEffect } from 'react';

const MainPage = () => {
  const [activeTab, setActiveTab] = useState('All Status');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  // 1. Các State quản lý dữ liệu động
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  // Đặt chung một URL để dễ gọi
  const API_URL = "http://localhost:8000/api/v1/tasks";

  // ----------------------------------------------------------------
  // CÁC HÀM GỌI API (FETCH, POST, PUT, DELETE)
  // ----------------------------------------------------------------

  // [GET] Lấy danh sách Task
  const fetchTasks = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === 200) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    }
  };

  // Tự động gọi API lấy danh sách khi component vừa render
  useEffect(() => {
    fetchTasks();
  }, []);

  // [POST] Thêm Task mới
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      alert("Vui lòng nhập tên công việc!");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: newTaskPriority,
          status: "Incomplete"
        })
      });
      const result = await response.json();
      
      if (result.status === 201) {
        setIsAddTaskModalOpen(false); // Đóng popup
        setNewTaskTitle('');          // Xóa chữ trong ô input
        setNewTaskPriority('High');   // Reset dropdown
        fetchTasks();                 // Load lại danh sách mới nhất
      }
    } catch (error) {
      console.error("Lỗi khi thêm task:", error);
    }
  };

  // [PUT] Đánh dấu hoàn thành
  const handleMarkDone = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Gửi status mới lên server. Ở API Python của bạn quy định là chữ "Complete"
        body: JSON.stringify({ status: "Complete" }) 
      });
      
      if (response.ok) {
        fetchTasks(); // Load lại data để giao diện cập nhật
      }
    } catch (error) {
      console.error("Lỗi cập nhật task:", error);
    }
  };
  const handleEditTask = async () => {
    try {
      const response = await fetch(`${API_URL}/${taskToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: taskToEdit.title,
          priority: taskToEdit.priority,
          status: taskToEdit.status
        }),
      });
      if (response.ok) {
        fetchTasks();
        setIsEditTaskModalOpen(false); 
        setTaskToEdit(null); 
      } else {
        console.error("Backend trả về lỗi:", await response.json());
      }
    } catch (error) {
      console.error("Have some trouble with editing this task!", error);
    }
  };
  // [DELETE] Xóa Task
  const handleDelete = async () => {
      try {
        // Dùng state taskToDelete thay vì taskId
        const response = await fetch(`${API_URL}/${taskToDelete}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          fetchTasks();
          setIsDeleteTaskModalOpen(false); // Xóa xong thì đóng popup luôn
          setTaskToDelete(null); // Dọn dẹp state
        }
      } catch (error) {
        console.error("Lỗi khi xóa task:", error);
      }
  };

  // ----------------------------------------------------------------
  // CÁC HÀM HỖ TRỢ XỬ LÝ UI
  // ----------------------------------------------------------------

  // Hàm tự động gán màu tuỳ theo priority từ Backend gửi về
  const getPriorityColor = (priority) => {
    const p = priority.toLowerCase();
    if (p === 'critical') return 'text-red-500';
    if (p === 'high') return 'text-yellow-400';
    if (p === 'medium') return 'text-teal-400';
    return 'text-blue-400'; // low
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'All Status') return true;
    if (activeTab === 'Incomplete Tasks') return task.status === 'Incomplete';
    if (activeTab === 'Completed Tasks') return task.status === 'Complete';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#cbf3fd] font-sans flex flex-col relative">
      
      {/* HEADER */}
      <header className="bg-[#121929] px-6 py-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <img src={"./logo.png"}className='w-10 h-10'></img>
          <h1 className="text-[#ff9a9e] text-3xl font-bold tracking-wide">Todo Website</h1>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 rounded-[10px]">
        
        {/* Tabs */}
        <div className="flex bg-[#82abc2] w-fit p-2 rounded-[10px] gap-2 border-b-2 border-[#82abc2]">
          <button onClick={() => setActiveTab('All Status')} className={`px-6 py-1.5 rounded text-sm font-bold border border-gray-600 transition bg-[#fbe49c] text-black ${activeTab === 'All Status' ? 'underline underline-offset-4' : ''}`}>
            All Status
          </button>
          <button onClick={() => setActiveTab('Incomplete Tasks')} className={`px-6 py-1.5 rounded text-sm font-bold border border-gray-600 transition bg-[#da8386] text-black ${activeTab === 'Incomplete Tasks' ? 'underline underline-offset-4' : ''}`}>
            Incomplete Tasks
          </button>
          <button onClick={() => setActiveTab('Completed Tasks')} className={`px-6 py-1.5 rounded text-sm font-bold border border-gray-600 transition bg-[#cde49c] text-black ${activeTab === 'Completed Tasks' ? 'underline underline-offset-4' : ''}`}>
            Completed Tasks
          </button>
        </div>

        {/* Task List */}
        <div className="bg-[#79a3bc] rounded-[10px] rounded-b-xl rounded-tr-xl border-2 border-[#82abc2] p-4 relative min-h-[65vh] shadow-inner mt-2 h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-5 pt-2">
            {filteredTasks.map((task) => (
              <div key={task.id} className="relative bg-white rounded-md p-3 flex justify-between items-center shadow-sm border border-gray-300 mt-2">
                
                {/* Status Badge */}
                <div className={`absolute -top-3 left-4 px-3 py-0.5 text-[9px] font-bold rounded-full border border-gray-500 text-black ${
                  task.status === 'Complete' ? 'bg-[#cde49c]' : 'bg-[#da8386]'
                }`}>
                  {task.status}
                </div>

                {/* Left Content */}
                <div className="flex items-center gap-4 mt-1">
                  <span className="font-bold text-gray-800 text-sm">
                    {task.title} <span className={getPriorityColor(task.priority)}>[{task.priority}]</span>
                  </span>
                  {task.status === 'Incomplete' && (
                    <button 
                      onClick={() => {
                        setTaskToEdit(task); 
                        setIsEditTaskModalOpen(true); 
                      }} 
                      className="bg-[#fbe49c] text-black border border-gray-500 px-4 py-0.5 text-xs font-bold rounded hover:bg-yellow-300 transition"
                    >
                      EDIT
                    </button>
                  )}
                </div>

                {/* Right Content */}
                <div className="flex items-center gap-2 mt-1">
                  {task.status === 'Incomplete' && (
                    <button 
                      onClick={() => handleMarkDone(task.id)}
                      className="bg-[#9cd3a1] text-black border border-gray-500 px-4 py-0.5 text-[10px] font-bold rounded hover:bg-green-400 transition"
                    >
                      Done
                    </button>
                  )}
                  <button onClick={() => {
                    setTaskToDelete(task.id);
                    setIsDeleteTaskModalOpen(true);
                  }}
                    className="bg-[#da8386] text-black border border-gray-500 px-4 py-0.5 text-[10px] font-bold rounded hover:bg-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setIsAddTaskModalOpen(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-white rounded-full flex justify-center items-center text-4xl text-black border border-gray-400 shadow-lg hover:scale-105 transition hover:bg-gray-50 pb-2">
            +
          </button>
        </div>
      </main>

      {/* POPUP ADD TASK */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#729cbe] px-8 py-6 rounded-xl shadow-2xl w-full max-w-[400px]">
            
            <div className="mb-4">
              <p className="text-[35px]"><strong>CREATE NEW TASK</strong></p>
              <label className="block text-black text-lg font-bold mb-1">Name</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Design UIX" 
                className="bg-[#ffffff] w-full px-4 py-2.5 rounded-xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-white placeholder-gray-300 text-black text-lg"
              />
            </div>

            <div className="mb-8">
              <label className="block text-black text-lg font-bold mb-1">Priority</label>
              <select 
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-black text-lg bg-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex justify-center gap-4">
              <button onClick={handleAddTask} className="bg-[#9cd3a1] text-black text-lg font-bold px-6 py-1.5 rounded-xl border-2 border-black hover:bg-green-400 transition">
                Save
              </button>
              <button onClick={() => setIsAddTaskModalOpen(false)} className="bg-[#da8386] text-black text-lg font-bold px-6 py-1.5 rounded-xl border-2 border-black hover:bg-red-400 transition">
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP DELETE TASK */}
      {isDeleteTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#729cbe] px-8 py-6 rounded-xl shadow-2xl w-full max-w-[400px] flex flex-col items-center">
      
            <div className="mb-3 text-[#da8386]">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="w-16 h-16"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" 
                />
              </svg>
            </div>

            <p className="text-[24px] text-center font-bold mb-6 text-black">
              DO YOU WANT TO DELETE THIS TASK?
            </p>
            
            <div className="flex justify-center gap-4 w-full">
              <button 
                onClick={handleDelete} 
                className="bg-[#9cd3a1] text-black text-lg font-bold px-6 py-1.5 rounded-xl border-2 border-black hover:bg-green-400 transition w-full"
              >
                Yes
              </button>
              <button 
                onClick={() => setIsDeleteTaskModalOpen(false)} 
                className="bg-[#da8386] text-black text-lg font-bold px-6 py-1.5 rounded-xl border-2 border-black hover:bg-red-400 transition w-full"
              >
                No
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP EDIT TASK */}
      {isEditTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#729cbe] px-8 py-6 rounded-xl shadow-2xl w-full max-w-[400px]">
            
            <div className="mb-4">
              {/* Đã sửa lại tiêu đề cho đúng ngữ cảnh */}
              <p className="text-[35px]"><strong>EDIT TASK</strong></p>
              <label className="block text-black text-lg font-bold mb-1">Name</label>
              <input 
                type="text" 
                // 1. Lấy dữ liệu từ taskToEdit hiển thị lên (thêm || '' để tránh lỗi undefined)
                value={taskToEdit?.title || ''}
                // 2. Cập nhật thẳng vào object taskToEdit khi người dùng gõ phím
                onChange={(e) => setTaskToEdit({ ...taskToEdit, title: e.target.value })}
                placeholder="Design UIX" 
                className="bg-[#ffffff] w-full px-4 py-2.5 rounded-xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-white placeholder-gray-300 text-black text-lg"
              />
            </div>

            <div className="mb-8">
              <label className="block text-black text-lg font-bold mb-1">Priority</label>
              <select 
                // 3. Tương tự với Priority
                value={taskToEdit?.priority || 'Low'}
                onChange={(e) => setTaskToEdit({ ...taskToEdit, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-black text-lg bg-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex justify-center gap-4">
              <button onClick={handleEditTask} className="bg-[#9cd3a1] text-black text-lg font-bold px-6 py-1.5 rounded-xl border-2 border-black hover:bg-green-400 transition">
                Save
              </button>
              <button onClick={() => setIsEditTaskModalOpen(false)} className="bg-[#da8386] text-black text-lg font-bold px-6 py-1.5 rounded-xl border-2 border-black hover:bg-red-400 transition">
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;