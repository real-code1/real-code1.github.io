public class TableWhile {
    public static void main(String[] args) {
        int row = 1;
        while (row <= 10) {
            for (int column = 1; column <= 10; column++) {
                System.out.printf("%4d", row * column);
            }
            System.out.println();
            row++;
        }
    }
}
