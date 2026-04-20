import type { Request } from "express";
import { Op } from "sequelize";
import type { CostumeListQuery } from "../dto";
import { Costume } from "../models/Costume";
import { CostumeImage } from "../models/CostumeImage";
import { Review } from "../models/Review";
import { getPagination } from "../utils/pagination";

export class CostumeService {
  private costumeListQueryFromRequestQuery(q: Request["query"]): CostumeListQuery {
    const { q: search, category, size, gender, theme, sort, page, pageSize } = q;
    const str = (v: unknown) => (typeof v === "string" ? v : undefined);
    const num = (v: unknown) => (v !== undefined && v !== "" && v !== null ? Number(v) : undefined);
    return {
      q: str(search),
      category: str(category),
      size: str(size),
      gender: str(gender),
      theme: str(theme),
      sort: str(sort),
      page: num(page),
      pageSize: num(pageSize)
    };
  }

  async listFromRequestQuery(query: Request["query"]) {
    return this.list(this.costumeListQueryFromRequestQuery(query));
  }

  async list(query: CostumeListQuery) {
    const where: any = { is_active: true };
    if (query.q) {
      where.name = { [Op.like]: `%${query.q}%` };
    }
    if (query.category) where.category = query.category;
    if (query.size) where.size = query.size;
    if (query.gender) where.gender = query.gender;
    if (query.theme) where.theme = query.theme;
    const { offset, limit, page, pageSize } = getPagination(query.page, query.pageSize);
    const order: any[] = [];
    if (query.sort === "price_asc") order.push(["base_price_per_day", "ASC"]);
    else if (query.sort === "price_desc") order.push(["base_price_per_day", "DESC"]);
    else order.push(["created_at", "DESC"]);
    const { rows, count } = await Costume.findAndCountAll({
      where,
      include: [{ model: CostumeImage }],
      offset,
      limit,
      order
    });
    return { data: rows, page, pageSize, total: count };
  }

  async getByIdFromParams(params: Request["params"]) {
    return this.getById(Number(params.id));
  }

  async getById(id: number) {
    const costume = await Costume.findByPk(id, { include: [CostumeImage] });
    if (!costume) {
      throw new Error("Costume not found");
    }
    const reviews = await Review.findAll({ where: { costume_id: id } });
    const ratingCount = reviews.length;
    const ratingSum = reviews.reduce((s, r) => s + r.rating, 0);
    const avgRating = ratingCount > 0 ? ratingSum / ratingCount : null;
    return { costume, ratingCount, avgRating };
  }
}
