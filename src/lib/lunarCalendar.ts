/**
 * Quy doi Am lich <-> Duong lich cho lich Viet Nam (mui gio +7), dua tren
 * thuat toan thien van cua Ho Ngoc Duc (public domain, duoc hau het cac thu
 * vien lich Viet su dung) - hoan toan tinh toan, khong can tra cuu du lieu
 * ngoai. Chi dung cho MOT viec: giup nhap ngay nghi/le am lich (vd "10/3 am
 * lich" - Gio To Hung Vuong, hoac "mung 1 Tet") ra dung ngay duong lich cho
 * nam duoc chon, thay vi phai tu tra cuu bang tay.
 *
 * LUU Y QUAN TRONG: rieng Tet Nguyen Dan, Chinh phu cong bo NGHI CA MOT
 * KHOANG nhieu ngay (thuong hoan doi them ca ngay nghi bu cuoi tuan lien ke) -
 * ham nay chi tra ve DUNG ngay am lich duoc chon (vd mung 1 Tet), KHONG suy ra
 * ca khoang nghi - admin van phai tu quyet dinh va khai bao them cac ngay lien
 * ke theo thong bao nghi le chinh thuc hang nam.
 */

function INT(value: number): number {
    return Math.floor(value);
}

const DEG_TO_RAD = Math.PI / 180;

/** Ngay Julius (JDN) tu ngay/thang/nam duong lich - chuan lich Gregory. */
function jdFromDate(dd: number, mm: number, yy: number): number {
    const a = INT((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd =
        dd +
        INT((153 * m + 2) / 5) +
        365 * y +
        INT(y / 4) -
        INT(y / 100) +
        INT(y / 400) -
        32045;
    if (jd < 2299161) {
        jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    }
    return jd;
}

/** Ngay/thang/nam duong lich tu ngay Julius (JDN). */
function jdToDate(jd: number): { day: number; month: number; year: number } {
    let a: number;
    let b: number;
    let c: number;
    if (jd > 2299160) {
        a = jd + 32044;
        b = INT((4 * a + 3) / 146097);
        c = a - INT((b * 146097) / 4);
    } else {
        b = 0;
        c = jd + 32082;
    }
    const d = INT((4 * c + 3) / 1461);
    const e = c - INT((1461 * d) / 4);
    const m = INT((5 * e + 2) / 153);
    const day = e - INT((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * INT(m / 10);
    const year = b * 100 + d - 4800 + INT(m / 10);
    return { day, month, year };
}

/** Thoi diem (JDN, co phan thap phan) cua ky trang thu k ke tu diem goc. */
function newMoon(k: number): number {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * DEG_TO_RAD);

    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

    let c1 =
        (0.1734 - 0.000393 * T) * Math.sin(M * DEG_TO_RAD) +
        0.0021 * Math.sin(2 * DEG_TO_RAD * M);
    c1 -= 0.4068 * Math.sin(Mpr * DEG_TO_RAD) - 0.0161 * Math.sin(DEG_TO_RAD * 2 * Mpr);
    c1 -= 0.0004 * Math.sin(DEG_TO_RAD * 3 * Mpr);
    c1 += 0.0104 * Math.sin(DEG_TO_RAD * 2 * F) - 0.0051 * Math.sin(DEG_TO_RAD * (M + Mpr));
    c1 -= 0.0074 * Math.sin(DEG_TO_RAD * (M - Mpr)) - 0.0004 * Math.sin(DEG_TO_RAD * (2 * F + M));
    c1 -= 0.0004 * Math.sin(DEG_TO_RAD * (2 * F - M)) + 0.0006 * Math.sin(DEG_TO_RAD * (2 * F + Mpr));
    c1 += 0.001 * Math.sin(DEG_TO_RAD * (2 * F - Mpr)) + 0.0005 * Math.sin(DEG_TO_RAD * (2 * Mpr + M));

    const deltaT =
        T < -11
            ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
            : -0.000278 + 0.000265 * T + 0.000262 * T2;

    return jd1 + c1 - deltaT;
}

/** Kinh do mat troi (radian, 0..2pi) tai thoi diem JDN da cho. */
function sunLongitude(jdn: number): number {
    const T = (jdn - 2451545.0) / 36525;
    const T2 = T * T;
    const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let dl = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(DEG_TO_RAD * M);
    dl += (0.019993 - 0.000101 * T) * Math.sin(DEG_TO_RAD * 2 * M);
    dl += 0.00029 * Math.sin(DEG_TO_RAD * 3 * M);
    let L = (L0 + dl) * DEG_TO_RAD;
    L -= Math.PI * 2 * INT(L / (Math.PI * 2));
    return L;
}

/** Chi so "cung hoang dao mat troi" (0..11) dung de xac dinh thang co nhuan. */
function getSunLongitude(dayNumber: number, timeZone: number): number {
    return INT((sunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI) * 6);
}

/** Ngay JDN (nguyen) cua ky trang thu k, quy doi theo mui gio dia phuong. */
function getNewMoonDay(k: number, timeZone: number): number {
    return INT(newMoon(k) + 0.5 + timeZone / 24);
}

/** JDN cua ngay bat dau thang 11 am lich (thang co Dong chi) cua nam yy. */
function getLunarMonth11(yy: number, timeZone: number): number {
    const off = jdFromDate(31, 12, yy) - 2415021.076998695;
    const k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    const sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
    return nm;
}

/** Vi tri (offset) cua thang nhuan trong mot nam am lich co 13 thang trang. */
function getLeapMonthOffset(a11: number, timeZone: number): number {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
        last = arc;
        i += 1;
        arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
}

export type LunarDate = {
    day: number;
    month: number;
    year: number;
    /** true neu day la thang NHUAN cua nam am lich (hiem, ~7 nam/1 lan). */
    isLeap: boolean;
};

export type SolarDate = { day: number; month: number; year: number };

/**
 * Quy doi mot ngay am lich sang duong lich. `isLeapMonth` chi can dat true
 * neu nguoi dung CHU DICH chon "thang nhuan" (hiem gap, UI nen mac dinh
 * false/an di truong nay tru phi that su can). timeZone mac dinh +7 (Viet
 * Nam). Tra ve null neu to hop nam/thang nhuan khong ton tai trong nam do
 * (vd chon nhuan sai thang).
 */
export function convertLunarToSolar(
    lunarDay: number,
    lunarMonth: number,
    lunarYear: number,
    isLeapMonth = false,
    timeZone = 7,
): SolarDate | null {
    let a11: number;
    let b11: number;
    if (lunarMonth < 11) {
        a11 = getLunarMonth11(lunarYear - 1, timeZone);
        b11 = getLunarMonth11(lunarYear, timeZone);
    } else {
        a11 = getLunarMonth11(lunarYear, timeZone);
        b11 = getLunarMonth11(lunarYear + 1, timeZone);
    }

    const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    let off = lunarMonth - 11;
    if (off < 0) off += 12;

    if (b11 - a11 > 365) {
        const leapOff = getLeapMonthOffset(a11, timeZone);
        let leapMonth = leapOff - 2;
        if (leapMonth < 0) leapMonth += 12;
        if (isLeapMonth && lunarMonth !== leapMonth) return null;
        if (isLeapMonth || off >= leapOff) off += 1;
    } else if (isLeapMonth) {
        // Nam am lich nay khong co thang nhuan.
        return null;
    }

    const monthStart = getNewMoonDay(k + off, timeZone);
    return jdToDate(monthStart + lunarDay - 1);
}

/** Quy doi mot ngay duong lich sang am lich (dung de hien thi tham khao). */
export function convertSolarToLunar(
    day: number,
    month: number,
    year: number,
    timeZone = 7,
): LunarDate {
    const dayNumber = jdFromDate(day, month, year);
    const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);

    let a11 = getLunarMonth11(year, timeZone);
    let b11 = a11;
    let lunarYear: number;
    if (a11 >= monthStart) {
        lunarYear = year;
        a11 = getLunarMonth11(year - 1, timeZone);
    } else {
        lunarYear = year + 1;
        b11 = getLunarMonth11(year + 1, timeZone);
    }

    const lunarDay = dayNumber - monthStart + 1;
    const diff = INT((monthStart - a11) / 29);
    let isLeap = false;
    let lunarMonth = diff + 11;

    if (b11 - a11 > 365) {
        const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
        if (diff >= leapMonthDiff) {
            lunarMonth = diff + 10;
            if (diff === leapMonthDiff) isLeap = true;
        }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

    return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap };
}
