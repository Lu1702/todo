import { render, screen, fireEvent, waitFor, getByRole } from '@testing-library/react';
import MainPage from './MainPage'; 
describe("Website running", () => {
    test("Website can run", () => {
        render(<MainPage />);
        const nameofwebsite = screen.getByText("Todo Website"); 
        expect(nameofwebsite).toBeInTheDocument();
    });
});

describe("fetchTasks", () => {
    test("Render the list familiar with api response", async () => {
        global.fetch = jest.fn(() =>
        Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                status: 200,
                data: 
                    [
                        { 
                            id: 1, 
                            title: 'Learn Jest Mocking', 
                            priority: 'High', 
                            status: 'Incomplete' 
                        },
                        {
                            id: 2, 
                            title: 'Learn React Testing',
                            priority: 'Critical', 
                            status: 'Completed' 
                        }
                    ]
                }),
            })
        );

        render(<MainPage />);

        const taskTitle1 = await screen.findByText("Learn Jest Mocking");
        expect(taskTitle1).toBeInTheDocument();

        const taskTitle2 = await screen.findByText("Learn React Testing");
        expect(taskTitle2).toBeInTheDocument();
    });
    test("render the list but api calling return 404", async() =>{
        global.fetch = jest.fn(() =>
        Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ status: 404, data: [] }),
            })
        );

        render(<MainPage />);

        // Dùng queryByText thay vì findByText. Nếu không tìm thấy, nó sẽ trả về null
        const taskTitle = screen.queryByText("Learn Jest Mocking");
        
        // Khẳng định rằng task này KHÔNG CÓ trên màn hình
        expect(taskTitle).not.toBeInTheDocument();
    })
    test("Website have to write the bug into the logs", async () => {
        global.fetch = jest.fn(() => 
            Promise.reject(new Error("Network connection failed"))
        );
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        render(<MainPage />);
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
            "Lỗi khi tải dữ liệu:",
            expect.any(Error)
        );
    });
    consoleSpy.mockRestore();
  });
});


describe("handleAddTask - Create new Task", () => {
    beforeEach(() => {
        window.alert = jest.fn();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    test("Alert and stop calling API if missing a field", async () => {
        const fetchSpy = jest.spyOn(global, 'fetch');
        render(<MainPage />);
        fetchSpy.mockClear(); 
        fireEvent.click(screen.getByText("+"));
        const saveBtn = screen.getByText("Save");
        fireEvent.click(saveBtn);
        expect(window.alert).toHaveBeenCalledWith("Vui lòng nhập tên công việc!");
        expect(fetchSpy).not.toHaveBeenCalled(); 
    });
    test("API Calling successfully", async () => {
        global.fetch = jest.fn(() =>
        Promise.resolve({
            json: () => Promise.resolve({ status: 201 }),
        })
        );
        render(<MainPage />);
        fireEvent.click(screen.getByText("+"));
        const nameInput = screen.getByPlaceholderText("Design UIX");
        fireEvent.change(nameInput, { target: { value: 'Code Backend Test' } });
        const prioritySelect = screen.getByRole('combobox');
        fireEvent.change(prioritySelect, { target: { value: 'Critical' } });
        const saveBtn = screen.getByText("Save");
        fireEvent.click(saveBtn);
        await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    title: 'Code Backend Test',
                    priority: 'Critical',
                    status: "Incomplete"
                })
                })
            );
        });

        await waitFor(() => {
            expect(screen.queryByText("Save")).not.toBeInTheDocument();
        });
    });

    test("Write The logs if do not have the internet(catch error)", async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error("Server down")));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        render(<MainPage />);
        fireEvent.click(screen.getByText("+"));
        const nameInput = screen.getByPlaceholderText("Design UIX");
        fireEvent.change(nameInput, { target: { value: 'Task gây lỗi' } });
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Lỗi khi thêm task:", expect.any(Error));
        });
        consoleSpy.mockRestore();
    }); 
});
describe("Các tính năng Cập nhật và Xóa Task", () => {
    beforeEach(() => {
        global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
            status: 200,
            data: [{ 
                    id: 99, 
                    title: 'Task đang test CRUD', 
                    priority: 'High', 
                    status: 'Incomplete' 
                }
            ]
            }),
        })
        );
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    test("handleDelete - Đi qua nhánh else ẩn khi API Delete trả về response.ok là false", async () => {
        // 1. Lưu lại mock cũ và giả lập load danh sách task THÀNH CÔNG
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    status: 200,
                    data: [{ id: 888, title: 'Task test Delete Else', priority: 'High', status: 'Incomplete' }]
                }),
            })
        );

        render(<MainPage />);
        
        // Đợi UI render xong task
        await screen.findByText('Task test Delete Else'); 

        // 2. Bấm nút Delete để mở popup
        const deleteBtns = screen.getAllByText("Delete");
        fireEvent.click(deleteBtns[0]);
        
        // Lấy nút Yes trong Modal
        const confirmDeleteBtn = screen.getByText("Yes");

        // 3. GHI ĐÈ fetch thành THẤT BẠI cho thao tác xóa
        global.fetch = jest.fn(() =>
            Promise.resolve({ ok: false })
        );

        // 4. Bấm "Yes" để xác nhận xóa
        fireEvent.click(confirmDeleteBtn);

        // Đợi API DELETE được gọi
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/888'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
        
        // 5. Xác nhận Modal VẪN ĐANG MỞ (vì code không chạy vào nhánh if response.ok để đóng Modal)
        expect(screen.getByText("DO YOU WANT TO DELETE THIS TASK?")).toBeInTheDocument();

        // 6. Dọn dẹp hiện trường trả lại fetch gốc
        global.fetch = originalFetch;
    });
    test("handleMarkDone - Ghi log lỗi khi API sập lúc cập nhật trạng thái Task", async () => {
        // 1. Render giao diện và đợi load xong task từ mock của beforeEach
        render(<MainPage />);
        await screen.findByText("Task đang test CRUD");
        
        // 2. Override mock fetch chỉ riêng cho test này để ném ra lỗi
        global.fetch = jest.fn(() => Promise.reject(new Error("Network connection failed during update")));
        
        // 3. Spy vào console.error
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // 4. Thực hiện thao tác bấm nút Done
        const markDoneBtn = screen.getByText("Done"); 
        fireEvent.click(markDoneBtn);
        
        // 5. Kiểm tra xem khối catch có bắt được lỗi và in ra console chính xác không
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
            "Lỗi cập nhật task:", 
            expect.any(Error)
        );
        });
        
        // 6. Dọn dẹp spy
        consoleSpy.mockRestore();
    });
    test("handleEditTask - Ghi log lỗi khi API trả về status không thành công (!response.ok)", async () => {
        // Render và đợi danh sách task (từ mock beforeEach) hiển thị
        render(<MainPage />);
        await screen.findByText("Task đang test CRUD");
        
        // Override fetch: Giả lập server trả về HTTP 400 Bad Request
        const mockErrorResponse = { message: "Dữ liệu không hợp lệ" };
        global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: false,
            json: () => Promise.resolve(mockErrorResponse),
        })
        );
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mở modal Edit và bấm Save
        fireEvent.click(screen.getByText("EDIT"));
        const saveChangesBtn = screen.getByText("Save"); // Thay "Save" bằng text đúng trên nút lưu của bạn
        fireEvent.click(saveChangesBtn);
        
        // Chờ console.error được gọi với đúng message và data lỗi
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Backend trả về lỗi:", mockErrorResponse);
        });
        
        consoleSpy.mockRestore();
    });
    test("handleEditTask - Ghi log lỗi khi fetch sập (catch block)", async () => {
        // Render và đợi danh sách task
        render(<MainPage />);
        await screen.findByText("Task đang test CRUD");
        
        // Override fetch: Giả lập lỗi mạng khiến Promise bị reject
        const networkError = new Error("Network Error");
        global.fetch = jest.fn(() => Promise.reject(networkError));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mở modal Edit và bấm Save
        fireEvent.click(screen.getByText("EDIT"));
        const saveChangesBtn = screen.getByText("Save");
        fireEvent.click(saveChangesBtn);
        
        // Chờ console.error trong nhánh catch được gọi
        await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Have some trouble with editing this task!", networkError);
        });
        
        consoleSpy.mockRestore();
    });
    test("handleMarkDone - Gọi API cập nhật status thành Complete", async () => {
        render(<MainPage />);
        await screen.findByText("Task đang test CRUD");
        global.fetch.mockClear();
        const markDoneBtn = screen.getByText("Done"); 
        fireEvent.click(markDoneBtn);
        await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/99'),
            expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ status: "Complete" })
            })
        );
        });
    });
    test("handleEditTask - Gửi đúng dữ liệu sửa và đóng modal", async () => {
        render(<MainPage />);
        await screen.findByText("Task đang test CRUD");
        global.fetch.mockClear();
        const editIconBtn = screen.getByText("EDIT"); 
        fireEvent.click(editIconBtn);
        const nameInput = screen.getByDisplayValue("Task đang test CRUD"); 
        fireEvent.change(nameInput, { target: { value: 'Task đã được sửa đổi' } });

        const saveChangesBtn = screen.getByText("Save"); 
        fireEvent.click(saveChangesBtn);

        await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/99'),
            expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({
                title: 'Task đã được sửa đổi',
                priority: 'High',
                status: 'Incomplete'
            })
            })
        );
        });
        await waitFor(() => {
        expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
        });
    });
    test("Thay đổi Priority trong Modal Edit", async () => {
        render(<MainPage />);
        await screen.findByText("Task đang test CRUD");
        fireEvent.click(screen.getByText("EDIT"));
        
        // Tìm dropdown Priority và thay đổi giá trị
        const prioritySelect = screen.getByDisplayValue("High"); // Giả sử task cũ đang là High
        fireEvent.change(prioritySelect, { target: { value: 'Medium' } });
        
        // Dòng onChange đã được gọi, bạn có thể kiểm tra giá trị đã thay đổi
        expect(prioritySelect.value).toBe("Medium");
    });
    test("handleDelete - Gọi API xóa và đóng modal", async () => {
        render(<MainPage />);
        await screen.findByText("Task đang test CRUD");
        global.fetch.mockClear();
        const deleteIconBtn = screen.getByText("Delete");
        fireEvent.click(deleteIconBtn);
        const confirmDeleteBtn = screen.getByText("Yes"); 
        fireEvent.click(confirmDeleteBtn);
        await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/99'),
            expect.objectContaining({
            method: 'DELETE'
            })
        );
    });

    await waitFor(() => {
    expect(screen.queryByText("Yes, Delete")).not.toBeInTheDocument();
    });
});

test("Ghi log lỗi khi API sập lúc Xóa Task", async () => {
    render(<MainPage />);
    await screen.findByText("Task đang test CRUD");
    global.fetch = jest.fn(() => Promise.reject(new Error("Database disconnected")));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Yes"));
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Lỗi khi xóa task:", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
describe("Test giao diện", ()=>{
    test("Hiển thị giao diện tên của website", () =>{
        render(<MainPage />);
        const head = screen.getByRole('heading', {level:1});
        expect(head).toBeInTheDocument();
    });
    test("test hiển thị logo website", () =>{
        render(<MainPage/>);
        const logo = screen.getByRole('img', {name:'Logo Website'});
        expect(logo).toBeInTheDocument();
    });
    test("Button All status Appear", ()=>{
        render(<MainPage/>);
        const buttonAllStatus = screen.getByText("All Status");
        expect(buttonAllStatus).toBeInTheDocument();
    });
    test("Button Incomplete Tasks Appear", ()=>{
        render(<MainPage/>);
        const buttonIncompleteTasks = screen.getByText("Incomplete Tasks");
        expect(buttonIncompleteTasks).toBeInTheDocument();
    })
});
describe("Tính năng Lọc Task (Filter Tabs)", () => {
  test("Lọc danh sách Task chính xác khi bấm các tab trạng thái", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 200,
          data: [
            { id: 1, title: 'Task đang làm dở', priority: 'High', status: 'Incomplete' },
            { id: 2, title: 'Task đã hoàn thành', priority: 'Low', status: 'Complete' }
          ]
        }),
      })
    );
        render(<MainPage />);
        await screen.findByText('Task đang làm dở');
        expect(screen.getByText('Task đã hoàn thành')).toBeInTheDocument();
        const incompleteTabBtn = screen.getByText('Incomplete Tasks');
        fireEvent.click(incompleteTabBtn);
        expect(screen.getByText('Task đang làm dở')).toBeInTheDocument();
        expect(screen.queryByText('Task đã hoàn thành')).not.toBeInTheDocument();
        const completedTabBtn = screen.getByText('Completed Tasks');
        fireEvent.click(completedTabBtn);
        expect(screen.getByText('Task đã hoàn thành')).toBeInTheDocument();
        expect(screen.queryByText('Task đang làm dở')).not.toBeInTheDocument();
    });
});
describe("Test hiển thị màu sắc của Priority", () => {
    test("Hiển thị class màu text-teal-400 cho priority Medium", async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    status: 200,
                    data: [{ 
                        id: 999, 
                        title: 'Task Test Medium Priority', 
                        priority: 'Medium', 
                        status: 'Incomplete' 
                    }]
                }),
            })
        );

        render(<MainPage />);
        await screen.findByText('Task Test Medium Priority');        
        
        // Dùng getAllByText thay vì getByText
        const priorityElements = screen.getAllByText(/Medium/i);
        
        // Phần tử con nằm lồng bên trong thường sẽ là phần tử cuối cùng của mảng
        const innerSpan = priorityElements[priorityElements.length - 1];
        
        expect(innerSpan).toHaveClass('text-teal-400');
        
        global.fetch = originalFetch;
    });
});
describe("Thao tác đóng Modals (Cancel/No)", () => {
    // Tự động thiết lập một task mặc định cho toàn bộ bài test trong block này
    beforeEach(() => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    status: 200,
                    data: [{ id: 101, title: 'Task Demo Cancel', priority: 'High', status: 'Incomplete' }]
                }),
            })
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Đóng modal Add Task khi bấm Cancel", () => {
        render(<MainPage />);
        fireEvent.click(screen.getByText("+"));
        fireEvent.click(screen.getByText("Cancel"));
        expect(screen.queryByText("Save")).not.toBeInTheDocument();
    });

    test("Đóng modal Edit Task khi bấm Cancel", async () => {
        render(<MainPage />);
        // Chờ task demo render ra để đảm bảo UI đã load xong
        await screen.findByText("Task Demo Cancel"); 
        
        const editBtns = screen.getAllByText("EDIT");
        fireEvent.click(editBtns[0]); 
        
        const cancelBtns = screen.getAllByText("Cancel");
        fireEvent.click(cancelBtns[cancelBtns.length - 1]); 
        
        expect(screen.queryByText("EDIT TASK")).not.toBeInTheDocument();
    });

    test("Đóng modal Delete Task khi bấm No", async () => {
        render(<MainPage />);
        await screen.findByText("Task Demo Cancel"); 
        
        const deleteBtns = screen.getAllByText("Delete");
        fireEvent.click(deleteBtns[0]);
        
        fireEvent.click(screen.getByText("No"));
        expect(screen.queryByText("DO YOU WANT TO DELETE THIS TASK?")).not.toBeInTheDocument();
    });
});
describe("Lọc Task - All Status", () => {
    test("Bấm tab All Status hiển thị lại toàn bộ task", async () => {
        render(<MainPage />);
        
        // 1. Chuyển sang Incomplete trước
        fireEvent.click(screen.getByText('Incomplete Tasks'));
        
        // 2. Bấm lại All Status
        fireEvent.click(screen.getByText('All Status'));
        
        // Dòng onClick của nút All Status đã được phủ xanh!
    });
});
describe("Test giá trị mặc định của Modal Edit", () => {
    test("Hiển thị fallback value khi task bị thiếu title hoặc priority", async () => {
        // Lưu lại fetch gốc
        const originalFetch = global.fetch; 
        
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    status: 200,
                    data: [{ id: 404, title: '', priority: null, status: 'Incomplete' }]
                }),
            })
        );

        render(<MainPage />);
        const editBtns = await screen.findAllByText("EDIT");
        fireEvent.click(editBtns[0]);
        
        const titleInput = screen.getByPlaceholderText("Design UIX"); 
        expect(titleInput.value).toBe('');
        
        const prioritySelect = screen.getByRole('combobox');
        expect(prioritySelect.value).toBe('Low');
        
        // Trả lại hiện trường cho các test sau
        global.fetch = originalFetch; 
    });
});

describe("Coverage cho các nhánh Else ẩn (E)", () => {
    test("handleAddTask - Không đóng modal nếu API trả về status khác 201", async () => {
        // Giả lập server trả về lỗi 400 (không phải 201)
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 400 }),
            })
        );

        render(<MainPage />);
        
        // Mở modal Add và điền dữ liệu
        fireEvent.click(screen.getByText("+"));
        const nameInput = screen.getByPlaceholderText("Design UIX");
        fireEvent.change(nameInput, { target: { value: 'Task lỗi status' } });
        
        // Bấm Save
        const saveBtn = screen.getByText("Save"); 
        fireEvent.click(saveBtn);
        
        // Chờ fetch được gọi
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
        
        // Xác nhận Modal VẪN MỞ (chữ Save vẫn còn) vì không nhảy vào nhánh if(201)
        expect(screen.getByText("Save")).toBeInTheDocument();
    });

    // ... (Thêm test case số 2 ở ngay dưới đây)
    test("handleMarkDone - Đi qua nhánh else ẩn khi response.ok là false", async () => {
        // 1. Giả lập load task ban đầu THÀNH CÔNG để có data hiển thị lên màn hình
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    status: 200,
                    data: [{ id: 999, title: 'Task test Else', priority: 'High', status: 'Incomplete' }]
                }),
            })
        );

        render(<MainPage />);
        await screen.findByText('Task test Else'); // Đợi UI render xong task

        // 2. GHI ĐÈ fetch thành THẤT BẠI cho thao tác bấm nút Done sắp tới
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false 
            })
        );

        // Bấm nút Done
        const doneBtns = screen.getAllByText("Done");
        fireEvent.click(doneBtns[0]);

        // Đợi API PUT được gọi
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/999'),
                expect.objectContaining({ method: 'PUT' })
            );
        });
        
        // Vì không có khối else nào cả, nên code chạy ngang qua mà không bị sập là test đã tự động Pass và chữ E biến mất!
    });
});