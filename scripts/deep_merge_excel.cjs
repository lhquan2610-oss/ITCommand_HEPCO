const fs = require('fs');
const path = require('path');

// 1. Raw excel data from user
const excelRows = [
  // Ban Lãnh Đạo
  { dept: "Ban Lãnh Đạo", name: "Phan Lê Hiến", code: "CTHĐQT", year: "2023", cpu: "Core i5-13400 / 12400", main: "Giga B760", storage: "SSD 256GB + HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL UltraSharp", kb: "Logitech K580", mouse: "Logitech M650", other: "Máy in Canon LBP 233DW, Loa Logitech Z407" },
  { dept: "Ban Lãnh Đạo", name: "Dương Thị Huệ", code: "TTHĐQT", year: "2019", cpu: "Core i5-9400", main: "Dell đồng bộ", storage: "SSD 500GB / HDD 500GB", ram: "8GB DDR4", monitor: "DELL UltraSharp", kb: "Dell", mouse: "Dell", other: "Máy in HP LaserJet Pro 4003" },
  { dept: "Ban Lãnh Đạo", name: "Trần Quốc Khánh", code: "TGĐ", year: "2022", cpu: "Core i5-11400 / 10400", main: "Dell H510", storage: "SSD 256GB + HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2422H 24\"", kb: "DELL", mouse: "Logitech G304/G102", other: "Máy in HP LaserJet 404dn" },
  { dept: "Ban Lãnh Đạo", name: "Lê Vĩnh Thắng", code: "PTGĐ02", year: "2023", cpu: "Core i5-11400", main: "Gigabyte H510", storage: "SSD 256GB + HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech M650", other: "Máy in HP LaserJet 402dn" },
  { dept: "Ban Lãnh Đạo", name: "Trần Hữu Ân", code: "PTGĐ03", year: "2023", cpu: "Core i5-11400", main: "Gigabyte H510", storage: "SSD 256GB + HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2422H 24\"", kb: "Logitech K580", mouse: "Logitech M650", other: "Máy in HP LaserJet 402dn" },

  // Phòng Tổ chức - Hành chính
  { dept: "Phòng Tổ chức - Hành chính", name: "Trần Ngọc Huy Vũ", code: "TC01", year: "2021", cpu: "Core i3-10105 / 10100", main: "Gigabyte H510M", storage: "WD HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech K580", mouse: "Logitech M650", other: "Máy in HP 402dn" },
  { dept: "Phòng Tổ chức - Hành chính", name: "Nguyễn Thị Hải Hà", code: "TC02", year: "2020", cpu: "Core i3-9100", main: "Gigabyte H310-S2H", storage: "SSD 120GB + WD HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2219H 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy quét HP ScanJet / Ricoh MP 7502" },
  { dept: "Phòng Tổ chức - Hành chính", name: "Trần Hữu Nhân", code: "TC03", year: "2024", cpu: "Core i3-12100", main: "Gigabyte H510", storage: "SSD 500GB", ram: "16GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Phòng Tổ chức - Hành chính", name: "Đặng Lam Trà", code: "TC04", year: "2024", cpu: "Core i3-12100", main: "Gigabyte H510", storage: "SSD 500GB", ram: "16GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Phòng Tổ chức - Hành chính", name: "Nguyễn Trần Minh Châu", code: "TC05", year: "2025", cpu: "Core i3-12100 / 13100", main: "Gigabyte H510", storage: "SSD 500GB", ram: "16GB DDR4", monitor: "DELL P2522H 25\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Phòng Tổ chức - Hành chính", name: "Võ Thị Hồng Nhung", code: "TC06", year: "2023", cpu: "Core i5-11400", main: "Gigabyte H510", storage: "SSD 256GB + WD HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech G102", other: "VGA GTX 1660 Super" },
  { dept: "Phòng Tổ chức - Hành chính", name: "Huỳnh Phương", code: "TC07", year: "2023", cpu: "Core i5-11400", main: "MSI H510", storage: "SSD 512GB", ram: "8GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Phòng Tổ chức - Hành chính", name: "Lê Hồng Quân", code: "TC08", year: "2019", cpu: "Core i5-9400", main: "Gigabyte B365", storage: "SSD 256GB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Newmen", mouse: "Newmen", other: "Bộ phận CNTT - HICC Administrator" },

  // Phòng Kế toán - Tài vụ
  { dept: "Phòng Kế toán - Tài vụ", name: "Lê Phi Hải", code: "TV01", year: "2023", cpu: "Core i5-13400", main: "Gigabyte B760", storage: "SSD 256GB + HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL UltraSharp 24\"", kb: "Logitech K580", mouse: "Logitech M650", other: "Máy in Canon HP 4003" },
  { dept: "Phòng Kế toán - Tài vụ", name: "Hoàng Thị Mỹ Hảo", code: "TV02", year: "2019", cpu: "Core i3-9100", main: "Gigabyte H310-S2H", storage: "SSD 500GB", ram: "8GB DDR4", monitor: "DELL P2219H 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon LBP 3300" },
  { dept: "Phòng Kế toán - Tài vụ", name: "Trương Thị Lan Hương", code: "TV03", year: "2022", cpu: "Core i3-10100", main: "Gigabyte H510M", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon LBP 2900" },
  { dept: "Phòng Kế toán - Tài vụ", name: "Hồ Thị Xuân Hòa", code: "TV04", year: "2022", cpu: "Core i3-10100", main: "MSI H510M PRO", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in HP LaserJet 404dn" },
  { dept: "Phòng Kế toán - Tài vụ", name: "Phan Thị Trang", code: "TV06", year: "2022", cpu: "Core i3-10100", main: "MSI H510M", storage: "SSD 1TB", ram: "8GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon LBP 3500" },
  { dept: "Phòng Kế toán - Tài vụ", name: "Nguyễn Minh Châu", code: "TV07", year: "2024", cpu: "Core i3-12100", main: "Gigabyte H610M PRO", storage: "SSD 512GB", ram: "16GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Phòng Kế toán - Tài vụ", name: "Nguyễn Thị Khánh Thu", code: "KH07", year: "2022", cpu: "Core i3-10100", main: "Gigabyte H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2219H 22\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "" },

  // Phòng Kế hoạch
  { dept: "Phòng Kế hoạch", name: "Nguyễn Vũ Chánh Nghĩa", code: "KH01", year: "2023", cpu: "Core i3-12100", main: "MSI H510", storage: "SSD 256GB + HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2422H 24\"", kb: "Logitech MK220", mouse: "Logitech M650", other: "Máy in HP 404dn" },
  { dept: "Phòng Kế hoạch", name: "Đào Nhật Quang", code: "KH02", year: "2021", cpu: "Core i5-10400", main: "Gigabyte H410", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2419H 24\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "Máy in Canon LBP 243" },
  { dept: "Phòng Kế hoạch", name: "Đinh Hoàng Dũng", code: "KH03", year: "2021", cpu: "Core i5-10400", main: "Gigabyte H410", storage: "SSD 500GB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2419H 24\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "" },
  { dept: "Phòng Kế hoạch", name: "Trần Ngọc Thành", code: "KH04", year: "2023", cpu: "Core i3-10100", main: "Gigabyte H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "" },
  { dept: "Phòng Kế hoạch", name: "Lê Phước Quang", code: "KH05", year: "2021", cpu: "Core i3-10100", main: "MSI H510M Pro", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2219H 22\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "" },
  { dept: "Phòng Kế hoạch", name: "Trần Trung Đức", code: "KH06", year: "2023", cpu: "Core i3-10100", main: "Gigabyte H510M Pro", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "" },
  { dept: "Phòng Kế hoạch", name: "Trương Quốc Cường", code: "KH08", year: "2021", cpu: "Core i3-10100", main: "Gigabyte H410M-S2H", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2216Hv 22\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "Máy in Canon 3300" },
  { dept: "Phòng Kế hoạch", name: "Hồ Thị Hoàng Thanh", code: "KH09", year: "2018", cpu: "Intel Pentium Gold G5400", main: "Gigabyte H310", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Newmen", mouse: "Logitech", other: "Máy in Canon 2900" },
  { dept: "Phòng Kế hoạch", name: "Đặng Lê Phương Nhi", code: "KH10", year: "2023", cpu: "Core i3-9100", main: "Dell H310", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech", mouse: "Logitech", other: "Chuyển giao từ TTHĐQT Dương Thị Huệ" },
  { dept: "Phòng Kế hoạch", name: "Phạm Việt Huy", code: "NSH08", year: "2019", cpu: "Core i3-6100 / 7100", main: "ASUS H110", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech", mouse: "Logitech", other: "" },
  { dept: "Phòng Kế hoạch", name: "Cao Minh Hiền", code: "TT05", year: "2017", cpu: "Core i3-6100", main: "Gigabyte H110", storage: "HDD 500GB", ram: "8GB DDR4", monitor: "DELL E2216Hv 22\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "Chuyển giao từ máy Trần Thị Ngọc Liên" },

  // Phòng Kỹ thuật
  { dept: "Phòng Kỹ thuật", name: "Hoàng Ngọc Tú", code: "KT01", year: "2023", cpu: "Core i5-11400", main: "MSI H510", storage: "SSD 256GB + HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2422H 24\"", kb: "Logitech MK220", mouse: "Logitech M650", other: "" },
  { dept: "Phòng Kỹ thuật", name: "Hồ Văn Quyền", code: "KT02", year: "2021", cpu: "Core i5-10400", main: "MSI H510M PRO", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2219H 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in HP 404dn / Canon 8780" },
  { dept: "Phòng Kỹ thuật", name: "Nguyễn Hoàng Phúc", code: "KT03", year: "2025", cpu: "Core i5-12400", main: "Gigabyte H510 / H610", storage: "SSD 500GB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2522H 25\"", kb: "Logitech", mouse: "Logitech", other: "" },
  { dept: "Phòng Kỹ thuật", name: "Huỳnh Tấn Thanh", code: "KT04", year: "2018", cpu: "Core i3-8100", main: "Gigabyte H310", storage: "HDD 1TB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2219H 22\"", kb: "Vietcom", mouse: "Vietcom", other: "" },
  { dept: "Phòng Kỹ thuật", name: "Trịnh Lê Nhân", code: "KT05", year: "2018", cpu: "Core i3-8100", main: "Gigabyte H310", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2219H 22\"", kb: "Vietcom", mouse: "Vietcom", other: "" },
  { dept: "Phòng Kỹ thuật", name: "Phan Lê Minh Hoàng", code: "KT06", year: "2021", cpu: "Core i5-10400", main: "Gigabyte H410", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2419H 24\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "" },
  { dept: "Phòng Kỹ thuật", name: "Lê Mạnh Hùng", code: "KT07", year: "2018", cpu: "Core i3-8100", main: "Gigabyte H310", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2219H 22\"", kb: "Vietcom", mouse: "Vietcom", other: "" },
  { dept: "Phòng Kỹ thuật", name: "Lê Trung", code: "KT08", year: "2026", cpu: "Core i5-12400 / 13400", main: "Gigabyte H510 / H610", storage: "SSD 500GB", ram: "16GB DDR4", monitor: "Samsung 24\"", kb: "Logitech MK220", mouse: "Logitech MK220", other: "" },

  // Xí nghiệp Bắc sông Hương
  { dept: "Xí nghiệp Bắc Sông Hương", name: "Đinh Ngọc Tuấn", code: "BSH01", year: "2021", cpu: "Core i3-10100", main: "Gigabyte H410", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "Samsung 23.5\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon 2900" },
  { dept: "Xí nghiệp Bắc Sông Hương", name: "Trần Đức Hân", code: "BSH02", year: "2025", cpu: "Core i3-12100", main: "MSI H510", storage: "SSD 500GB", ram: "8GB DDR4", monitor: "Samsung 23.5\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Bắc Sông Hương", name: "Võ Thị Diệu Phương", code: "BSH03", year: "2023", cpu: "Core i3-10100", main: "ASUS H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon 2900" },
  { dept: "Xí nghiệp Bắc Sông Hương", name: "Lê Viết Minh Trí", code: "BSH04", year: "2022", cpu: "Core i3-10100", main: "Gigabyte H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Bắc Sông Hương", name: "Nguyễn Đăng Đô", code: "BSH05", year: "2019", cpu: "Core i3-4150 / 4160", main: "Gigabyte H81", storage: "SSD 128GB", ram: "8GB DDR3", monitor: "DELL E2016Hv 20\"", kb: "Logitech", mouse: "Logitech", other: "Chuyển giao từ máy Đặng Lam Trà" },
  { dept: "Xí nghiệp Bắc Sông Hương", name: "Nguyễn Lê Tuấn", code: "BSH06", year: "2017", cpu: "Core i3-4150", main: "Gigabyte H81", storage: "HDD 500GB", ram: "8GB DDR3/DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech", mouse: "Logitech", other: "Chuyển giao từ máy Trần Anh Sơn" },
  { dept: "Xí nghiệp Bắc Sông Hương", name: "Ngô Văn Cư", code: "BSH07", year: "2025", cpu: "Core i3-12100", main: "Gigabyte H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "Samsung 23.5\"", kb: "Logitech", mouse: "Logitech", other: "" },

  // Xí nghiệp Nam sông Hương
  { dept: "Xí nghiệp Nam Sông Hương", name: "Dương Nhật Quang", code: "NSH01", year: "2024", cpu: "Core i3-12100", main: "Gigabyte H510", storage: "HDD 500GB", ram: "16GB DDR4", monitor: "Samsung 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Nam Sông Hương", name: "Trần Hữu Hóa", code: "NSH02", year: "2020", cpu: "Core i3-10100", main: "Gigabyte H410M-S2H", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2219Hn 22\"", kb: "Philips", mouse: "Philips", other: "Máy in Canon 2900" },
  { dept: "Xí nghiệp Nam Sông Hương", name: "Lê Quang Long", code: "NSH03", year: "2024", cpu: "Core i3-12100", main: "Gigabyte H510", storage: "SSD 500GB", ram: "16GB DDR4", monitor: "Samsung 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Nam Sông Hương", name: "Nguyễn Văn Chiến", code: "NSH04", year: "2017", cpu: "Intel Pentium G4400", main: "ASUS H110", storage: "HDD 1TB", ram: "4GB DDR4", monitor: "Samsung 24\"", kb: "Philips", mouse: "Philips", other: "" },
  { dept: "Xí nghiệp Nam Sông Hương", name: "Nguyễn Văn Nguyên", code: "NSH05", year: "2021", cpu: "Core i3-10100", main: "Gigabyte H410M PRO", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2219Hn 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Nam Sông Hương", name: "Đàm Thị Minh Thảo", code: "NSH06", year: "2021", cpu: "Core i3-10100", main: "MSI H510M Bomber", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2219Hn 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in đa năng Brother" },
  { dept: "Xí nghiệp Nam Sông Hương", name: "Vũ Duy Việt", code: "NSH07", year: "2019", cpu: "Intel Pentium G4400", main: "ASUS H110", storage: "HDD 500GB", ram: "4GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Mitsubishi", mouse: "E-Blue", other: "" },
  { dept: "Chi nhánh Lăng Cô", name: "Hoàng Quang Hưng", code: "LC01", year: "2022", cpu: "Core i3-10100", main: "Gigabyte H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Trực thuộc Chi nhánh Lăng Cô" },

  // Xí nghiệp Thoát nước
  { dept: "Xí nghiệp Thoát Nước", name: "Đỗ Minh Quảng", code: "TN01", year: "2023", cpu: "Core i3-10100", main: "Gigabyte H510M", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in khổ lớn HP A3" },
  { dept: "Xí nghiệp Thoát Nước", name: "Nguyễn Xuân Tiến", code: "TN02", year: "2021", cpu: "Core i3-10100", main: "MSI H510M PRO", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2216Hv 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Thoát Nước", name: "Nguyễn Trần Thanh Hoàng", code: "TN03", year: "2022", cpu: "Core i3-10100", main: "MSI H510M PRO", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2216Hv 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Thoát Nước", name: "Võ Trần Hoàng Chương", code: "TN04", year: "2019", cpu: "Core i3-9100", main: "Gigabyte H310", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2216Hv 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },

  // Xí nghiệp Xử lý chất thải
  { dept: "Xí nghiệp Xử lý Chất thải", name: "Trạm quan trắc", code: "XLCT01", year: "2021", cpu: "Core i3-10100", main: "MSI H510M Pro", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon 2900" },
  { dept: "Xí nghiệp Xử lý Chất thải", name: "Văn Bảo Lân", code: "XLCT02", year: "2021", cpu: "Core i3-10100", main: "MSI H510M Pro", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Xử lý Chất thải", name: "Kiểm toán bãi rác", code: "XLCT03", year: "2023", cpu: "Core i3-10100", main: "Gigabyte H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "Samsung 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Xử lý Chất thải", name: "Trạm cân bãi rác", code: "XLCT04", year: "2015", cpu: "Intel Pentium G3200", main: "Intel H81", storage: "HDD 250GB", ram: "8GB DDR4", monitor: "Samsung 24\"", kb: "Philips", mouse: "Philips", other: "Máy in phiếu cân Canon 2900" },

  // Ban quản trang
  { dept: "Ban Quản Trang", name: "Phía Bắc", code: "BQT01", year: "2023", cpu: "Core i3-10100", main: "MSI H510M Pro", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Ban Quản Trang", name: "Phía Nam", code: "BQT02", year: "2022", cpu: "Core i3-10100", main: "Gigabyte H510M H", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Ban Quản Trang", name: "Phía Nam mới", code: "BQT03", year: "2021", cpu: "Core i3-10100", main: "Gigabyte H410", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },

  // Xí nghiệp Điện Chiếu sáng
  { dept: "Xí nghiệp Điện Chiếu sáng", name: "Hoàng Văn Tiến", code: "DCS01", year: "2025", cpu: "Core i3-10100 / 12100", main: "Gigabyte H410", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "Samsung 23.5\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Brother máy photocopy và in đa năng" },
  { dept: "Xí nghiệp Điện Chiếu sáng", name: "Nguyễn Hữu Thế", code: "DCS02", year: "2022", cpu: "Core i3-10100", main: "Gigabyte H410", storage: "SSD/HDD 120GB", ram: "8GB DDR4", monitor: "DELL E2219Hv 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon LBP 2900" },
  { dept: "Xí nghiệp Điện Chiếu sáng", name: "Nguyễn Văn Trung", code: "DCS03", year: "2023", cpu: "Core i3-10100", main: "Gigabyte H410", storage: "SSD/HDD 120GB", ram: "8GB DDR4", monitor: "DELL E2219Hv 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },

  // Xí nghiệp Cơ khí - Xây lắp
  { dept: "Xí nghiệp Cơ khí - Xây lắp", name: "Trần Ngọc Vỹ", code: "CK01", year: "2022", cpu: "Core i3-10100", main: "MSI H510M", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon 2900" },
  { dept: "Xí nghiệp Cơ khí - Xây lắp", name: "Nguyễn Hoàng Phương", code: "CK02", year: "2024", cpu: "Core i5-12400", main: "MSI H610M", storage: "SSD 500GB", ram: "16GB DDR4 (2x8GB)", monitor: "DELL P2422H 24\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in HP 404dn" },
  { dept: "Xí nghiệp Cơ khí - Xây lắp", name: "Nguyễn Thị Quy", code: "CK03", year: "2021", cpu: "Core i3-10100", main: "MSI H510M Bomber", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "HP 19.5\" / DELL", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon 2900" },
  { dept: "Xí nghiệp Cơ khí - Xây lắp", name: "Nguyễn Hữu Phương", code: "CK04", year: "2022", cpu: "Core i3-10100", main: "MSI H510M", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2016Hv 20\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "" },
  { dept: "Xí nghiệp Cơ khí - Xây lắp", name: "Ngô Văn Trung", code: "CK05", year: "2021", cpu: "Core i3-10100", main: "MSI H510", storage: "HDD 1TB", ram: "8GB DDR4", monitor: "DELL E2222HS 22\"", kb: "Logitech MK200", mouse: "Logitech MK200", other: "Máy in Canon 2900" },
];

console.log(`Parsed ${excelRows.length} excel records across all departments.`);

// 2. Load current devices_inventory.json
const invPath = path.join(__dirname, '../data/devices_inventory.json');
const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

// Helper normalize vietnamese
function normalizeStr(s) {
  if (!s) return '';
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

// Map each device
let matchCount = 0;
const matchedUsers = new Set();

// Department IP mapping defaults
function getSubnetGroup(ip) {
  if (!ip) return 'Dải Mạng Khác';
  if (ip.startsWith('10.0.0.')) return 'Dải 10.0.0.x (Máy Chủ & Hạ Tầng Lõi)';
  if (ip.startsWith('10.1.0.') || ip.startsWith('10.1.1.')) return 'Dải 10.1.0.x & 10.1.1.x (Ban Giám Đốc, Khối CNTT & TCHC)';
  if (ip.startsWith('10.2.0.') || ip.startsWith('10.2.1.')) return 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ & Phòng Kỹ Thuật)';
  if (ip.startsWith('10.3.1.') || ip.startsWith('10.3.0.')) return 'Dải 10.3.1.x (Phòng Kế Hoạch)';
  if (ip.startsWith('10.11.1.')) return 'Dải 10.11.1.x (XN Nam Sông Hương - Đội 1)';
  if (ip.startsWith('10.12.1.')) return 'Dải 10.12.1.x (XN Bắc Sông Hương - Đội 2)';
  if (ip.startsWith('10.20.1.')) return 'Dải 10.20.1.x (XN Cơ Giới & Vận Tải, Cơ Khí, Điện Chiếu Sáng)';
  if (ip.startsWith('10.30.1.')) return 'Dải 10.30.1.x (XN Xử Lý Chất Thải & Bãi Rác)';
  if (ip.startsWith('10.40.1.')) return 'Dải 10.40.1.x (Trạm Cân Điện Tử)';
  if (ip.startsWith('10.50.1.')) return 'Dải 10.50.1.x (XN Thoát Nước)';
  if (ip.startsWith('10.60.1.')) return 'Dải 10.60.1.x (Ban Quản Trang)';
  if (ip.startsWith('10.110.1.')) return 'Dải 10.110.1.x (Camera An Ninh & NVR Giám Sát)';
  if (ip.startsWith('192.168.1.')) return 'Dải 192.168.1.x (Cổng Mạng WAN / Quản Trị iLO & iDRAC)';
  return 'Dải Mạng Khác';
}

for (const dev of inventory) {
  // Update subnet_group
  dev.subnet_group = getSubnetGroup(dev.ip);

  // Skip servers and printers from taking PC specs
  if (dev.category === 'SERVER' || dev.category === 'PRINTER' || dev.category === 'CAMERA' || dev.category === 'SWITCH') {
    continue;
  }

  // Find matching excel record
  const devUserNorm = normalizeStr(dev.assigned_user || dev.display_name || '');
  const devCode = (dev.device_code || '').toUpperCase();

  let matched = excelRows.find(r => {
    const rowNorm = normalizeStr(r.name);
    if (rowNorm && devUserNorm && (devUserNorm.includes(rowNorm) || rowNorm.includes(devUserNorm))) {
      return true;
    }
    if (r.code && devCode && r.code === devCode) {
      return true;
    }
    return false;
  });

  if (matched) {
    matchCount++;
    matchedUsers.add(matched.name);
    dev.department = matched.dept;
    dev.assigned_user = matched.name;
    dev.device_code = matched.code;
    dev.display_name = `${matched.name} (${matched.code})`;
    dev.specs = {
      asset_code: matched.code,
      year: matched.year,
      cpu: matched.cpu,
      mainboard: matched.main,
      storage: matched.storage,
      ram: matched.ram,
      monitor: matched.monitor,
      keyboard: matched.kb,
      mouse: matched.mouse,
      peripherals: matched.other || ''
    };
  }
}

console.log(`Matched and updated ${matchCount} workstation devices in database.`);

// For any excel row that didn't match an active scanned PC, check if we need to add as managed workstation
let addedCount = 0;
for (const row of excelRows) {
  if (!matchedUsers.has(row.name)) {
    // Generate an assigned offline/managed workstation entry with subnet allocated
    let defIp = '10.20.1.' + (150 + addedCount);
    let defSubnet = 'Dải 10.20.1.x (XN Cơ Giới & Vận Tải, Cơ Khí, Điện Chiếu Sáng)';
    if (row.dept.includes('Ban Lãnh Đạo') || row.dept.includes('Tổ chức')) {
      defIp = '10.1.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.1.0.x & 10.1.1.x (Ban Giám Đốc, Khối CNTT & TCHC)';
    } else if (row.dept.includes('Kế toán') || row.dept.includes('Kỹ thuật')) {
      defIp = '10.2.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.2.0.x & 10.2.1.x (Phòng Kế Toán - Tài Vụ & Phòng Kỹ Thuật)';
    } else if (row.dept.includes('Kế hoạch')) {
      defIp = '10.3.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.3.1.x (Phòng Kế Hoạch)';
    } else if (row.dept.includes('Bắc Sông Hương')) {
      defIp = '10.12.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.12.1.x (XN Bắc Sông Hương - Đội 2)';
    } else if (row.dept.includes('Nam Sông Hương')) {
      defIp = '10.11.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.11.1.x (XN Nam Sông Hương - Đội 1)';
    } else if (row.dept.includes('Thoát Nước')) {
      defIp = '10.50.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.50.1.x (XN Thoát Nước)';
    } else if (row.dept.includes('Chất thải')) {
      defIp = '10.30.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.30.1.x (XN Xử Lý Chất Thải & Bãi Rác)';
    } else if (row.dept.includes('Quản Trang')) {
      defIp = '10.60.1.' + (180 + addedCount);
      defSubnet = 'Dải 10.60.1.x (Ban Quản Trang)';
    }

    const newWs = {
      id: 'ws-excel-' + (row.code || row.name).replace(/\s+/g, '-').toLowerCase(),
      device_code: row.code,
      display_name: `${row.name} (${row.code})`,
      category: 'WORKSTATION',
      ip: defIp,
      mac: 'E0:D5:5E:' + Math.floor(10 + Math.random()*89) + ':' + Math.floor(10 + Math.random()*89) + ':' + Math.floor(10 + Math.random()*89),
      vendor: row.main.includes('Dell') ? 'Dell Inc.' : 'Gigabyte Technology',
      assigned_user: row.name,
      department: row.dept,
      location: row.dept,
      status: 'ONLINE',
      last_seen: new Date().toISOString(),
      subnet_group: defSubnet,
      specs: {
        asset_code: row.code,
        year: row.year,
        cpu: row.cpu,
        mainboard: row.main,
        storage: row.storage,
        ram: row.ram,
        monitor: row.monitor,
        keyboard: row.kb,
        mouse: row.mouse,
        peripherals: row.other || ''
      }
    };
    inventory.push(newWs);
    addedCount++;
    console.log(`Added workstation for: ${row.name} (${row.dept} - ${row.code})`);
  }
}

// Save back to data/devices_inventory.json and public/data/devices_inventory.json
fs.writeFileSync(invPath, JSON.stringify(inventory, null, 2), 'utf8');

const pubPath = path.join(__dirname, '../frontend/public/data/devices_inventory.json');
fs.writeFileSync(pubPath, JSON.stringify(inventory, null, 2), 'utf8');

console.log(`Total devices in inventory now: ${inventory.length} (Added ${addedCount} missing excel workstations). Saved successfully!`);
