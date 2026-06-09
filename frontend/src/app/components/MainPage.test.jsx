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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainPage from './MainPage';
import { describe } from 'node:test';
import { Main } from 'next/document';
import { log } from 'node:console';

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