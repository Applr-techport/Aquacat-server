"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const water_service_1 = require("./water.service");
let WaterController = class WaterController {
    waterService;
    constructor(waterService) {
        this.waterService = waterService;
    }
    async logWater(req, amount, drinkType) {
        return this.waterService.logWater(req.user.id, amount, drinkType || 'water');
    }
    async deleteLog(req, id) {
        return this.waterService.deleteLog(req.user.id, id);
    }
    async getToday(req) {
        return this.waterService.getToday(req.user.id);
    }
    async getCalendar(req, month) {
        return this.waterService.getCalendar(req.user.id, month);
    }
    async getWeekly(req) {
        return this.waterService.getWeekly(req.user.id);
    }
    async getStreak(req) {
        return this.waterService.getStreak(req.user.id);
    }
};
exports.WaterController = WaterController;
__decorate([
    (0, common_1.Post)('log'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Body)('drinkType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", Promise)
], WaterController.prototype, "logWater", null);
__decorate([
    (0, common_1.Delete)('log/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WaterController.prototype, "deleteLog", null);
__decorate([
    (0, common_1.Get)('today'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WaterController.prototype, "getToday", null);
__decorate([
    (0, common_1.Get)('calendar'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WaterController.prototype, "getCalendar", null);
__decorate([
    (0, common_1.Get)('weekly'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WaterController.prototype, "getWeekly", null);
__decorate([
    (0, common_1.Get)('streak'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WaterController.prototype, "getStreak", null);
exports.WaterController = WaterController = __decorate([
    (0, common_1.Controller)('water'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [water_service_1.WaterService])
], WaterController);
//# sourceMappingURL=water.controller.js.map