// Danh sách sản phẩm của cửa hàng
const products = [
  {
    id: "prod_001",
    name: "🍵 Bích Thủy Hoàn Nguyên",
    description: "Bích Thủy Hoàn Nguyên là một loại trà Oolong thuộc loại trà xanh từ Đôi Dép. Tên gọi Bích Thuỷ Hoàn Nguyên với ý nghĩa là màu nước xanh như ngọc bích thể hiện sự đẹp mắt của trà. Hương thơm của Bích Thủy Hoàn Nguyên vô cùng phong phú, kết hợp hài hòa giữa hương hoa rất mạnh và hương của cỏ cây tự nhiên. Vị ngọt tự nhiên của trà kèm theo hậu vị đắng chát nhẹ và dư vị đậm đà, mang lại trải nghiệm độc đáo.",
    price: 2699000,
    category: "Trà Oolong",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_002",
    name: "🍂 Bất Thụ Đông Phong",
    description: "Bất Thụ Đông Phong, với ý nghĩa là không sợ gió rét, là một loại trà Oolong thuộc loại hoàng trà của Đôi Dép. Mang trong mình hương vị của khói rang, nước trà của Bất Thụ Đông Phong có màu vàng óng có phần ngã đỏ do quá trình bồi hỏa cho trà. Với vị béo bùi đặc trưng, kết hợp với vị đắng và chát nhẹ, tròn đầy và suông miệng, đây là một trải nghiệm thưởng trà mới lạ và đầy hấp dẫn.",
    price: 2699000,
    category: "Hoàng trà",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_003",
    name: "🪵 Hoàng Tỳ Nhật Minh",
    description: "Hoàng Tỳ Nhật Minh là một loại trà Oolong thuộc loại hắc trà từ Đôi Dép, nổi bật với hương vị đặc trưng của gỗ quế, khói thuốc và xì gà. Với màu nâu đỏ cánh gián rất đẹp mắt, nước trà Hoàng Tỳ Nhật Minh mang lại cảm giác hấp dẫn và đầy ấn tượng từ lần đầu thưởng trà. Trà giúp thải độc tố cơ thể, giảm tác hại rượu bia, đặc biệt có chứa hàm lượng lớn GABA giúp giảm stress, ngủ ngon.",
    price: 1799000,
    category: "Hắc trà",
    image: "https://images.unsplash.com/photo-1594631252845-29fc4586d52c?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_004",
    name: "🏺 Hương Phù Ngõa Đỉnh",
    description: "Hương Phù Ngõa Đỉnh, với ý nghĩa là hương thơm bốc lên từ đỉnh sành, là một trong những loại trà xanh tinh túy của Đôi Dép. Trà mang hương thơm của hoa, ngọt sữa hòa cùng hương của cỏ cây kết hợp với hương của trái cây tươi mới. Nước trà màu xanh vàng óng ánh; vị tròn đầy, ngọt ngào pha chút đắng chát nhẹ, đem đến cho người thưởng trà một trải nghiệm tinh tế và sâu lắng.",
    price: 2699000,
    category: "Trà xanh",
    image: "https://images.unsplash.com/photo-1571934811356-5cc561b63d2c?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_005",
    name: "🎁 Ngũ Vị Trà",
    description: "Ngũ Vị Trà là bộ sản phẩm trà cao cấp, được kết hợp từ 5 loại trà thượng hạng của Đôi Dép bao gồm: Hảo Kỳ Trà, Xuân Nhật Trà, Nguyên Vị Trà, Phong Mật Trà và Hoàng Tỳ Nhật Minh. Mỗi loại trà trong Ngũ Vị Trà đều mang trong mình những nét hương, sắc, vị riêng biệt mà độc đáo đem lại trải nghiệm thưởng trà đa dạng. Đây là bộ sản phẩm thích hợp để làm quà tặng cho khách quý, hoặc để thưởng thức trong những dịp quan trọng.",
    price: 2499000,
    category: "Bộ quà tặng",
    image: "https://images.unsplash.com/photo-1597481616781-a773d2a7593c?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_006",
    name: "💎 Ngọc Trác Trà",
    description: "Ngọc Trác Trà là một loại trà Oolong thuộc dòng hoàng trà cao cấp từ Đôi Dép. Tên gọi Ngọc Trác Trà có nghĩa là viên ngọc thô được mài giũa, biểu trưng của sự quý phái và tao nhã trong nghệ thuật thưởng trà. Nước trà có màu vàng óng ánh, vị ngọt ngào, đậm đà của trà kết hợp với hương sữa nổi bật, khiến cho mỗi ngụm trà trở nên đặc biệt và lôi cuốn.",
    price: 1799000,
    category: "Hoàng trà",
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_007",
    name: "🍯 Phong Mật Trà",
    description: "Phong Mật Trà là một loại trà Oolong thuộc loại hồng trà đặc biệt của Đôi Dép, mang trong đó hương thơm dịu dàng của mật ong, mật mía và xì gà. Nước trà màu đỏ vàng; vị ngọt ngào tròn vị, dư vị đậm đà mang lại cảm giác ấm áp và thư giãn ngay từ cái nhìn đầu tiên. Phong Mật Trà là lựa chọn tuyệt vời cho mọi dịp, từ những buổi sáng tĩnh lặng đến những cuộc gặp gỡ bạn bè hay những buổi chiều thư giãn sau một ngày làm việc.",
    price: 1899000,
    category: "Hồng trà",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_008",
    name: "👸 Tâm Thanh Mỹ Nhân",
    description: "Tâm Thanh Mỹ Nhân, cái tên với ý nghĩa là một cô gái đẹp có tâm hồn trong sáng, thuộc loại hồng trà đặc biệt từ Đôi Dép. Với màu đỏ vàng rực rỡ, nước trà Tâm Thanh Mỹ Nhân không chỉ thu hút về màu sắc mà còn gợi lên hình ảnh của sự tươi mới và sức sống. Hương thơm thanh mát, nhẹ nhàng từ mùi trái cây chín mọng và mùi khói thuốc lá thoáng qua, khiến mỗi giọt trà trở nên đặc biệt và lôi cuốn.",
    price: 2699000,
    category: "Hồng trà",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_009",
    name: "🌸 Xuân Nhật Trà",
    description: "Xuân Nhật Trà là loại trà Oolong mang hương vị của cả bầu trời mùa xuân, hương thơm tinh dầu của lá trà giống đặc biệt từ Đôi Dép. Nước trà có màu vàng chanh, vị tròn đầy, dư vị đậm đà suông miệng, Xuân Nhật Trà lựa chọn hoàn hảo cho những những khoảng khắc thư giãn vào buổi sáng.",
    price: 1799000,
    category: "Trà Oolong",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "prod_010",
    name: "🧥 Đại Hoàng Bào",
    description: "Đại Hoàng Bào là dòng trà Oolong cao cấp thuộc thương hiệu Đôi Dép nổi bật với sắc nước vàng óng trong trẻo và hương hoa dành dành thanh tao đặc trưng. Trải qua quy trình chế biến công phu, trà sở hữu hương vị cân bằng, đa tầng với vị ngọt dịu tự nhiên và hậu vị kéo dài đầy tinh tế.",
    price: 2699000,
    category: "Trà Oolong",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80"
  }
];

module.exports = products;
